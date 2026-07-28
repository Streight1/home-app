import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];
const requiredKeys = [
  'NODE_ENV',
  'API_PORT',
  'WEB_PORT',
  'WEB_ORIGIN',
  'TRUST_PROXY',
  'APP_DOMAIN',
  'APP_PROTOCOL',
  'APP_RELEASE',
  'APP_ENV_LABEL',
  'ACME_EMAIL',
  'APP_RUNTIME_UID',
  'APP_RUNTIME_GID',
  'GATEWAY_MAX_REQUEST_BODY',
  'BACKUP_RETENTION_COUNT',
  'VPS_MIN_FREE_BYTES',
  'VITE_API_URL',
  'VITE_MAX_UPLOAD_BYTES',
  'VITE_FINANCE_IMPORT_MAX_FILE_BYTES',
  'VITE_APP_ENV_LABEL',
  'GOOGLE_CLIENT_ID',
  'VITE_GOOGLE_CLIENT_ID',
  'GOOGLE_ALLOWED_EMAILS',
  'SINGLE_HOUSEHOLD_MODE',
  'SINGLE_HOUSEHOLD_OWNER_EMAIL',
  'SINGLE_HOUSEHOLD_NAME',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'DATABASE_URL',
  'SESSION_COOKIE_NAME',
  'CSRF_COOKIE_NAME',
  'SESSION_TTL_DAYS',
  'INTERNAL_HEALTH_TOKEN',
  'UPLOAD_ROOT',
  'MAX_UPLOAD_BYTES',
  'FINANCE_IMPORT_MAX_FILE_BYTES',
  'FINANCE_IMPORT_MAX_ROWS',
  'FINANCE_IMPORT_SESSION_TTL_HOURS',
  'MAPY_API_ENABLED',
  'MAPY_API_KEY',
  'MAPY_API_TIMEOUT_MS',
  'MAPY_SUGGEST_MIN_QUERY_LENGTH',
  'MAPY_SUGGEST_MAX_RESULTS',
  'MAPY_DEFAULT_LANGUAGE',
];

async function findNestedEnvironmentFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...(await findNestedEnvironmentFiles(path)));
    if (entry.isFile() && entry.name.startsWith('.env')) files.push(path);
  }
  return files;
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (['dist', 'node_modules', 'storybook-static'].includes(entry.name))
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectSourceFiles(path)));
    if (entry.isFile()) files.push(path);
  }
  return files;
}

function parseEnvironment(source) {
  const values = new Map();
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) {
      errors.push(`.env.example:${index + 1} nemá platný KEY=value formát.`);
      continue;
    }
    const [, key, value] = match;
    if (values.has(key)) errors.push(`.env.example obsahuje ${key} vícekrát.`);
    values.set(key, value);
  }
  return values;
}

const example = await readFile(join(root, '.env.example'), 'utf8');
const values = parseEnvironment(example);

for (const key of requiredKeys) {
  if (!values.has(key)) errors.push(`.env.example neobsahuje ${key}.`);
}
for (const legacy of ['PORT']) {
  if (values.has(legacy))
    errors.push(`.env.example obsahuje zastaralou proměnnou ${legacy}.`);
}

const expectedReferences = new Map([
  ['WEB_ORIGIN', '${WEB_PORT}'],
  ['VITE_API_URL', '${API_PORT}'],
  ['VITE_MAX_UPLOAD_BYTES', '${MAX_UPLOAD_BYTES}'],
  ['VITE_FINANCE_IMPORT_MAX_FILE_BYTES', '${FINANCE_IMPORT_MAX_FILE_BYTES}'],
  ['VITE_APP_ENV_LABEL', '${APP_ENV_LABEL}'],
  ['VITE_GOOGLE_CLIENT_ID', '${GOOGLE_CLIENT_ID}'],
  ['DATABASE_URL', '${POSTGRES_USER}'],
]);
for (const [key, reference] of expectedReferences) {
  if (!values.get(key)?.includes(reference))
    errors.push(`${key} musí odkazovat na ${reference}.`);
}

for (const key of values.keys()) {
  if (key === 'VITE_MAPY_API_KEY')
    errors.push('Mapy API key nesmí mít prefix VITE_.');
  if (
    key.startsWith('VITE_') &&
    /(PASSWORD|SECRET|TOKEN|DATABASE_URL|SESSION_COOKIE)/.test(key)
  )
    errors.push(`${key} nesmí být vystavená browser bundlu.`);
}

for (const nested of await findNestedEnvironmentFiles(join(root, 'apps'))) {
  errors.push(
    `${nested.slice(root.length + 1)} nesmí duplikovat kořenovou konfiguraci.`,
  );
}

for (const file of await collectSourceFiles(join(root, 'apps/web'))) {
  const source = await readFile(file, 'utf8');
  if (/\b(?:VITE_)?MAPY_API_KEY\b/.test(source))
    errors.push(
      `${file.slice(root.length + 1)} nesmí obsahovat Mapy API key ani jeho browser konfiguraci.`,
    );
}

const compose = await readFile(join(root, 'compose.yaml'), 'utf8');
if (/\$\{POSTGRES_[A-Z_]+:-/.test(compose))
  errors.push(
    'compose.yaml nesmí skrývat chybějící PostgreSQL konfiguraci fallbackem.',
  );
for (const key of [
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_PORT',
]) {
  if (!compose.includes(`\${${key}:?`))
    errors.push(`compose.yaml nevynucuje ${key} z kořenového .env.`);
}

const productionCompose = await readFile(
  join(root, 'compose.prod.yaml'),
  'utf8',
);
if (!productionCompose.includes('VITE_API_URL: /api/v1'))
  errors.push(
    'compose.prod.yaml musí sestavit frontend se same-origin /api/v1.',
  );
for (const secret of [
  'DATABASE_URL',
  'POSTGRES_PASSWORD',
  'INTERNAL_HEALTH_TOKEN',
  'MAPY_API_KEY',
]) {
  if (new RegExp(`${secret}:\\s+(?!\\$\\{)[^\\n]+`).test(productionCompose))
    errors.push(`compose.prod.yaml obsahuje hardcoded hodnotu ${secret}.`);
}

const apiConfig = await readFile(
  join(root, 'apps/api/src/config/config.module.ts'),
  'utf8',
);
if (!apiConfig.includes("new URL('../../../../.env', import.meta.url)"))
  errors.push('Nest ConfigModule nenačítá kořenový .env kanonicky.');
if (!apiConfig.includes('expandVariables: true'))
  errors.push('Nest ConfigModule nemá zapnutou expanzi ${VAR}.');

const viteConfig = await readFile(
  join(root, 'apps/web/vite.development.config.ts'),
  'utf8',
);
if (!viteConfig.includes('envDir: workspaceRoot'))
  errors.push(
    'Aplikační Vite dev server nemá kořen workspace nastavený jako envDir.',
  );

const prismaConfig = await readFile(
  join(root, 'apps/api/prisma.config.ts'),
  'utf8',
);
if (!prismaConfig.includes("new URL('../../.env', import.meta.url)"))
  errors.push('Prisma nenačítá kořenový .env kanonicky.');
if (!prismaConfig.includes('expand(result)'))
  errors.push('Prisma konfigurace neexpanduje ${VAR}.');

if (errors.length > 0) {
  console.error(
    `Kontrola environment konfigurace selhala:\n- ${errors.join('\n- ')}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Kontrola environment konfigurace prošla (${requiredKeys.length} centrálních proměnných).`,
  );
}
