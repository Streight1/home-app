import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const docsRoot = join(root, 'docs');
const errors = [];
const ignoredDirectories = new Set([
  '.git',
  '.agents',
  '.codex',
  'coverage',
  'database',
  'dist',
  'generated',
  'node_modules',
  'playwright-report',
  'test-results',
  'uploads',
]);

const requiredDocuments = [
  'README.md',
  'AGENTS.md',
  'DESIGN.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'SECURITY.md',
  'docs/README.md',
  'docs/project-status.md',
  'docs/roadmap.md',
  'docs/glossary.md',
  'docs/design/README.md',
  'docs/design/product-ui-brief.md',
  'docs/design/responsive-layouts.md',
  'docs/design/screen-map.md',
  'docs/design/component-inventory.md',
  'docs/design/reference-board.md',
  'docs/design/content-guidelines.md',
  'docs/adr/0001-modular-monolith.md',
  'docs/adr/0002-google-auth-and-server-sessions.md',
  'docs/adr/0003-centralized-environment-configuration.md',
  'docs/architecture/overview.md',
  'docs/architecture/frontend.md',
  'docs/architecture/backend.md',
  'docs/architecture/data-model.md',
  'docs/architecture/authentication-and-authorization.md',
  'docs/architecture/storage.md',
  'docs/architecture/deployment.md',
  'docs/development/codex-workflow.md',
  'docs/development/continuous-integration.md',
  'docs/development/local-development.md',
  'docs/development/coding-standards.md',
  'docs/development/testing.md',
  'docs/development/database-migrations.md',
  'docs/development/documentation-rules.md',
  'docs/features/README.md',
  'docs/features/_template.md',
  'docs/features/authentication.md',
  'docs/features/documents.md',
  'docs/features/document-extraction.md',
  'docs/features/tasks.md',
  'docs/features/task-scheduling.md',
  'docs/features/calendar.md',
  'docs/features/locations-and-travel.md',
  'docs/features/workspace-navigation.md',
  'docs/features/household-members.md',
  'docs/features/finance.md',
  'docs/features/finance-imports.md',
  'docs/features/finance-categorization.md',
  'docs/features/finance-analytics.md',
  'docs/features/finance-budgets.md',
  'docs/features/spending-insights.md',
  'docs/features/recurring-expenses.md',
  'docs/features/bucket-list.md',
  'docs/api/endpoints.md',
  'docs/runbooks/google-oauth.md',
  'docs/runbooks/backup-and-restore.md',
  'docs/runbooks/troubleshooting.md',
  'docs/runbooks/mapy-api.md',
  'docs/runbooks/vps-deployment.md',
  'docs/runbooks/one-command-deployment.md',
  'docs/runbooks/container-registry.md',
];

const featureTemplateHeadings = [
  '# Název funkce',
  '## Stav',
  '## Účel',
  '## Uživatelské scénáře',
  '## Uživatelské rozhraní',
  '## API',
  '## Datový model',
  '## Autentizace a oprávnění',
  '## Validace a chybové stavy',
  '## Testy',
  '## Známá omezení',
  '## Budoucí možnosti',
];

async function collectFiles(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...(await collectFiles(path, predicate)));
    if (entry.isFile() && predicate(entry.name)) files.push(path);
  }
  return files;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function normalizeDestination(rawDestination) {
  const withoutTitle = rawDestination.trim().replace(/^<|>$/g, '');
  const [path] = withoutTitle.split('#', 1);
  return decodeURIComponent(path.split('?', 1)[0]);
}

function isExternalLink(destination) {
  return /^(?:[a-z][a-z+.-]*:|#)/i.test(destination);
}

function isRuntimePath(path) {
  const local = relative(root, path).split(sep).join('/');
  return (
    local === 'uploads' ||
    local.startsWith('uploads/') ||
    local === 'database/postgres' ||
    local.startsWith('database/postgres/')
  );
}

async function checkMarkdownLinks(markdownFiles) {
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const file of markdownFiles) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(linkPattern)) {
      const destination = match[1].trim();
      if (isExternalLink(destination)) continue;
      let normalized;
      try {
        normalized = normalizeDestination(destination);
      } catch {
        errors.push(
          `${relative(root, file)} obsahuje neplatně kódovaný odkaz.`,
        );
        continue;
      }
      if (!normalized) continue;
      const target = resolve(dirname(file), normalized);
      if (isRuntimePath(target)) {
        errors.push(
          `${relative(root, file)} odkazuje do runtime dat: ${normalized}.`,
        );
      }
      if (!(await exists(target))) {
        errors.push(
          `${relative(root, file)} obsahuje neexistující odkaz: ${normalized}.`,
        );
      }
    }
  }
}

function parseEnvironmentValues(source) {
  const values = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    if (value) values.push({ key, value });
  }
  return values;
}

async function checkEnvironmentSecrets(markdownFiles) {
  const allFiles = await collectFiles(root, () => true);
  const exampleFiles = allFiles.filter((file) => file.endsWith('.env.example'));
  const actualEnvironmentFiles = allFiles.filter((file) => {
    const name = file.slice(file.lastIndexOf(sep) + 1);
    return name.startsWith('.env') && !name.endsWith('.example');
  });
  const exampleValues = new Set();
  for (const file of exampleFiles) {
    for (const { value } of parseEnvironmentValues(
      await readFile(file, 'utf8'),
    ))
      exampleValues.add(value);
  }
  const documentation = (
    await Promise.all(markdownFiles.map((file) => readFile(file, 'utf8')))
  ).join('\n');
  const sensitiveKey = /(?:TOKEN|SECRET|PASSWORD|CLIENT_ID|DATABASE_URL)/;
  for (const file of actualEnvironmentFiles) {
    const values = parseEnvironmentValues(await readFile(file, 'utf8'));
    for (const { key, value } of values) {
      if (
        sensitiveKey.test(key) &&
        value.length >= 8 &&
        !exampleValues.has(value) &&
        documentation.includes(value)
      ) {
        errors.push(
          `${relative(root, file)} obsahuje hodnotu ${key}, která se objevuje v dokumentaci.`,
        );
      }
    }
  }
}

for (const document of requiredDocuments) {
  if (!(await exists(join(root, document))))
    errors.push(`Chybí povinný dokument ${document}.`);
}

const markdownFiles = await collectFiles(root, (name) => name.endsWith('.md'));
const docsIndex = await readFile(join(docsRoot, 'README.md'), 'utf8');
const rootReadme = await readFile(join(root, 'README.md'), 'utf8');
const agents = await readFile(join(root, 'AGENTS.md'), 'utf8');

if (!rootReadme.includes('docs/README.md'))
  errors.push('Kořenový README neodkazuje na docs/README.md.');
if (!agents.includes('docs/README.md'))
  errors.push('AGENTS.md neodkazuje na docs/README.md.');
if (!agents.includes('docs/development/codex-workflow.md'))
  errors.push('AGENTS.md neodkazuje na povinný Codex workflow.');

for (const file of markdownFiles.filter((path) =>
  path.startsWith(`${docsRoot}${sep}`),
)) {
  if (file === join(docsRoot, 'README.md')) continue;
  const indexedPath = relative(docsRoot, file).split(sep).join('/');
  if (!docsIndex.includes(indexedPath))
    errors.push(`docs/README.md neindexuje ${indexedPath}.`);
}

const template = await readFile(
  join(docsRoot, 'features/_template.md'),
  'utf8',
);
for (const heading of featureTemplateHeadings) {
  if (!template.split(/\r?\n/).includes(heading))
    errors.push(`Feature šablona neobsahuje nadpis: ${heading}.`);
}

const endpoints = await readFile(join(docsRoot, 'api/endpoints.md'), 'utf8');
for (const heading of ['## Public', '## Authenticated', '## Internal']) {
  if (!endpoints.split(/\r?\n/).includes(heading))
    errors.push(`Katalog endpointů neobsahuje sekci ${heading}.`);
}

const changelog = await readFile(join(root, 'CHANGELOG.md'), 'utf8');
if (!changelog.split(/\r?\n/).includes('## [Unreleased]'))
  errors.push('CHANGELOG.md neobsahuje sekci ## [Unreleased].');

await checkMarkdownLinks(markdownFiles);
await checkEnvironmentSecrets(markdownFiles);

if (errors.length > 0) {
  console.error(`Dokumentační kontrola selhala:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Dokumentační kontrola prošla (${markdownFiles.length} Markdown souborů, ${requiredDocuments.length} povinných dokumentů).`,
  );
}
