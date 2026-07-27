import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { parse } from 'yaml';

const root = process.cwd();
const workflowPath = '.github/workflows/publish-containers.yml';
const setupActionPath = '.github/actions/setup-project/action.yml';
const errors = [];

async function read(relativePath) {
  return readFile(join(root, relativePath), 'utf8');
}

function requireCondition(condition, message) {
  if (!condition) errors.push(message);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function externalUses(steps) {
  return steps
    .map((step) => step?.uses)
    .filter(
      (value) =>
        typeof value === 'string' &&
        !value.startsWith('./') &&
        !value.startsWith('docker://'),
    );
}

const [
  workflowSource,
  actionSource,
  composeSource,
  imagesSource,
  viteConfigSource,
  testRuntimeConfigSource,
  storybookPreviewSource,
] = await Promise.all([
  read(workflowPath),
  read(setupActionPath),
  read('deployment/compose.yaml'),
  read('deployment/images.json'),
  read('apps/web/vite.config.ts'),
  read('apps/web/src/lib/config/test-runtime-config.ts'),
  read('apps/web/.storybook/preview.tsx'),
]);

let workflow;
let setupAction;
let images;
try {
  workflow = parse(workflowSource);
  setupAction = parse(actionSource);
  images = JSON.parse(imagesSource);
} catch (error) {
  errors.push(`CI YAML/JSON nelze bezpečně načíst: ${error.message}`);
}

for (const [path, source] of [
  [workflowPath, workflowSource],
  [setupActionPath, actionSource],
]) {
  requireCondition(!source.includes('\t'), `${path} obsahuje tabulátor.`);
}

if (workflow && setupAction && images) {
  const jobs = workflow.jobs ?? {};
  const requiredJobs = [
    ['quality-static', 'Quality / Static checks'],
    ['api-tests', 'Tests / API'],
    ['web-tests', 'Tests / Web'],
    ['browser-tests', 'Tests / Browser'],
    ['container-validation', 'Containers / Validation'],
  ];
  const requiredNeeds = requiredJobs.map(([jobId]) => jobId);

  for (const [jobId, expectedName] of requiredJobs) {
    requireCondition(Boolean(jobs[jobId]), `Chybí povinný CI job ${jobId}.`);
    requireCondition(
      jobs[jobId]?.name === expectedName,
      `Job ${jobId} musí mít stabilní název „${expectedName}“.`,
    );
  }

  const publish = jobs.publish;
  requireCondition(Boolean(publish), 'Chybí publish job.');
  requireCondition(
    JSON.stringify(asArray(publish?.needs).sort()) ===
      JSON.stringify([...requiredNeeds].sort()),
    'Publish musí záviset na všech pěti validačních jobech.',
  );
  const publishCondition = String(publish?.if ?? '');
  requireCondition(
    publishCondition.includes("github.event_name != 'pull_request'"),
    'Publish job musí být na úrovni jobu zakázaný pro pull request.',
  );

  const triggers = workflow.on ?? workflow.true ?? {};
  requireCondition(
    Boolean(triggers.pull_request),
    'Workflow musí běžet na PR.',
  );
  requireCondition(
    asArray(triggers.push?.branches).includes('main'),
    'Workflow musí běžet na push do main.',
  );
  requireCondition(
    asArray(triggers.push?.tags).includes('v*.*.*'),
    'Workflow musí běžet pro release tag vX.Y.Z.',
  );
  requireCondition(
    Object.hasOwn(triggers, 'workflow_dispatch'),
    'Workflow musí podporovat workflow_dispatch.',
  );

  requireCondition(
    workflow.permissions?.contents === 'read' &&
      Object.keys(workflow.permissions).length === 1,
    'Výchozí workflow oprávnění musí být pouze contents: read.',
  );
  for (const [jobId, job] of Object.entries(jobs)) {
    const packagePermission = job.permissions?.packages;
    if (jobId === 'publish') {
      requireCondition(
        job.permissions?.contents === 'read' && packagePermission === 'write',
        'Pouze publish job musí mít contents: read a packages: write.',
      );
    } else {
      requireCondition(
        packagePermission !== 'write',
        `Job ${jobId} nesmí mít packages: write.`,
      );
    }
  }

  const setupSteps = setupAction.runs?.steps ?? [];
  const setupNodeIndex = setupSteps.findIndex((step) =>
    String(step.uses ?? '').startsWith('actions/setup-node@'),
  );
  const corepackIndex = setupSteps.findIndex((step) =>
    String(step.run ?? '').includes('corepack prepare'),
  );
  const installIndex = setupSteps.findIndex((step) =>
    String(step.run ?? '').includes('pnpm install --frozen-lockfile'),
  );
  const generateIndex = setupSteps.findIndex((step) =>
    String(step.run ?? '').includes('pnpm ci:generate'),
  );
  requireCondition(
    setupNodeIndex >= 0 &&
      corepackIndex > setupNodeIndex &&
      installIndex > corepackIndex &&
      generateIndex > installIndex,
    'Composite setup musí zachovat pořadí Node → Corepack/pnpm → install → Prisma generate.',
  );
  requireCondition(
    actionSource.includes('packageJson.packageManager') &&
      actionSource.includes('test "${actual_version}" = "${expected_version}"'),
    'Composite setup musí ověřit pnpm proti packageManager.',
  );

  for (const [jobId, job] of Object.entries(jobs)) {
    const steps = job.steps ?? [];
    const setupIndex = steps.findIndex(
      (step) => step.uses === './.github/actions/setup-project',
    );
    const firstPnpmIndex = steps.findIndex((step) =>
      String(step.run ?? '').match(/\bpnpm\b/),
    );
    if (firstPnpmIndex >= 0) {
      requireCondition(
        setupIndex >= 0 && setupIndex < firstPnpmIndex,
        `Job ${jobId} nesmí použít pnpm před composite setupem.`,
      );
    }
  }

  for (const jobId of ['quality-static', 'api-tests']) {
    const setupStep = jobs[jobId]?.steps?.find(
      (step) => step.uses === './.github/actions/setup-project',
    );
    requireCondition(
      setupStep?.with?.['generate-prisma'] === 'true',
      `Job ${jobId} musí před API kontrolami generovat Prisma Client.`,
    );
  }

  requireCondition(
    Boolean(jobs['api-tests']?.services?.postgres),
    'API test job musí používat izolovaný PostgreSQL service container.',
  );
  const browserCommands = (jobs['browser-tests']?.steps ?? [])
    .map((step) => step.run ?? '')
    .join('\n');
  requireCondition(
    browserCommands.includes(
      'pnpm --filter @life-admin/web exec playwright install --with-deps chromium',
    ) &&
      browserCommands.includes(
        'pnpm --filter @life-admin/web exec playwright --version',
      ),
    'Browser job musí instalovat a ověřit Playwright ze správného workspace.',
  );

  requireCondition(
    !/\bVITE_(?:API_URL|GOOGLE_CLIENT_ID|APP_ENV_LABEL|MAX_UPLOAD_BYTES)\b/.test(
      workflowSource,
    ),
    'Workflow nesmí obnovovat starou build-time Vite konfiguraci.',
  );
  requireCondition(
    /const environment = development\s*\?\s*loadEnv\([\s\S]*\)\s*:\s*\{\}/.test(
      viteConfigSource,
    ),
    'Vite smí číst deployment env pouze pro lokální serve režim.',
  );
  requireCondition(
    testRuntimeConfigSource.includes("API_URL: '/api/v1'") &&
      testRuntimeConfigSource.includes(
        "GOOGLE_CLIENT_ID: '000000000000-ci.apps.googleusercontent.com'",
      ) &&
      storybookPreviewSource.includes('installTestPublicRuntimeConfig'),
    'Vitest a Storybook musí sdílet centrální syntetickou runtime fixture.',
  );
  requireCondition(
    !/\|\|\s*true|continue-on-error:\s*true/.test(workflowSource),
    'Povinné CI kroky nesmějí používat continue-on-error ani || true.',
  );
  requireCondition(
    !/\bskip[_-](?:tests|checks)\b/i.test(workflowSource),
    'Workflow nesmí nabízet přeskočení povinných kontrol.',
  );
  requireCondition(
    !/\bpnpm\s+check\b/.test(
      (publish?.steps ?? []).map((step) => step.run ?? '').join('\n'),
    ),
    'Publish job nesmí znovu spouštět celou testovací sadu.',
  );

  const metadataTags = workflowSource;
  requireCondition(
    metadataTags.includes(
      "type=raw,value=staging,enable=${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}",
    ),
    'Staging tag musí vznikat jen z push do main.',
  );
  requireCondition(
    metadataTags.includes('type=sha,format=long,prefix=') &&
      metadataTags.includes('type=ref,event=tag') &&
      metadataTags.includes('type=semver,pattern={{major}}.{{minor}}') &&
      metadataTags.includes('type=semver,pattern={{major}}'),
    'Publish musí vytvářet full SHA a požadované semver tagy.',
  );
  requireCondition(
    !metadataTags.includes('type=raw,value=latest'),
    'Workflow nesmí automaticky publikovat latest.',
  );

  const allExternalActions = [
    ...externalUses(setupSteps),
    ...Object.values(jobs).flatMap((job) => externalUses(job.steps ?? [])),
  ];
  requireCondition(
    allExternalActions.length > 0 &&
      allExternalActions.every((value) => /^[^@\s]+@[0-9a-f]{40}$/.test(value)),
    'Všechny externí GitHub Actions musí být připnuté na úplný commit SHA.',
  );

  const allowedSecretExpressions = [
    ...workflowSource.matchAll(/secrets\.([A-Z0-9_]+)/g),
  ].map((match) => match[1]);
  requireCondition(
    allowedSecretExpressions.every((name) => name === 'GITHUB_TOKEN'),
    'Workflow smí používat pouze vestavěný secrets.GITHUB_TOKEN.',
  );

  requireCondition(
    composeSource.includes(
      `\${HOMEAPP_API_IMAGE:-${images.api}}:\${APP_IMAGE_TAG:-${images.defaultTag}}`,
    ) &&
      composeSource.includes(
        `\${HOMEAPP_WEB_IMAGE:-${images.web}}:\${APP_IMAGE_TAG:-${images.defaultTag}}`,
      ),
    'Compose image názvy a výchozí tag musí odpovídat deployment/images.json.',
  );
  requireCondition(
    workflowSource.includes('scripts/ci/resolve-image-reference.mjs'),
    'Publish workflow musí image názvy načítat z deployment/images.json.',
  );
  requireCondition(
    workflowSource.includes('deployment/compose.ci.yaml') ||
      workflowSource.includes('pnpm ci:containers'),
    'Container job musí používat izolovaný CI Compose smoke test.',
  );
}

if (errors.length > 0) {
  console.error(`CI workflow kontrola selhala:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    'CI workflow kontrola prošla (setup, job dependencies, permissions, tagy, runtime config a image kontrakt).',
  );
}
