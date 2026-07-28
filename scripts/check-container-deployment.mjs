import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];

async function read(path) {
  return readFile(join(root, path), 'utf8');
}

function requirePattern(source, pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

function forbidPattern(source, pattern, message) {
  if (pattern.test(source)) errors.push(message);
}

function serviceBlock(compose, service) {
  const match = compose.match(
    new RegExp(
      `^  ${service}:\\n([\\s\\S]*?)(?=^  [a-zA-Z][a-zA-Z0-9_-]*:\\n|^networks:\\n)`,
      'm',
    ),
  );
  if (!match) {
    errors.push(`deployment/compose.yaml postrádá službu ${service}.`);
    return '';
  }
  return match[1];
}

const [
  compose,
  restoreOverride,
  apiDockerfile,
  webDockerfile,
  caddy,
  gatewayEntrypoint,
  migrationRunner,
  healthcheck,
  runtimeConfig,
  webEnvironment,
  webIndex,
  secretResolver,
  backup,
  restore,
  migration,
  workflow,
] = await Promise.all([
  read('deployment/compose.yaml'),
  read('deployment/restore.compose.yaml'),
  read('apps/api/Dockerfile'),
  read('apps/web/Dockerfile'),
  read('deployment/Caddyfile'),
  read('deployment/gateway/entrypoint.sh'),
  read('deployment/api/run-migrations.mjs'),
  read('deployment/api/healthcheck.mjs'),
  read('apps/web/src/lib/config/runtime-config.ts'),
  read('apps/web/src/lib/config/environment.ts'),
  read('apps/web/index.html'),
  read('apps/api/src/config/secret-file-resolver.ts'),
  read('deployment/maintenance/backup.sh'),
  read('deployment/maintenance/restore.sh'),
  read('scripts/migrate-vps-data-to-volumes.sh'),
  read('.github/workflows/publish-containers.yml'),
]);

const volumesInit = serviceBlock(compose, 'volumes-init');
const database = serviceBlock(compose, 'db');
const migrate = serviceBlock(compose, 'migrate');
const api = serviceBlock(compose, 'api');
const gateway = serviceBlock(compose, 'gateway');
const backupService = serviceBlock(compose, 'backup');

forbidPattern(
  compose,
  /^\s+build:/m,
  'Registry deployment Compose nesmí obsahovat build sekci.',
);
requirePattern(
  api,
  /image:\s*\$\{HOMEAPP_API_IMAGE:-ghcr\.io\/streight1\/home-app-api\}:\$\{APP_IMAGE_TAG:-staging\}/,
  'API musí používat verzovaný GHCR image.',
);
requirePattern(
  migrate,
  /image:\s*\$\{HOMEAPP_API_IMAGE:-ghcr\.io\/streight1\/home-app-api\}:\$\{APP_IMAGE_TAG:-staging\}/,
  'Migrate musí používat stejný GHCR API image.',
);
requirePattern(
  gateway,
  /image:\s*\$\{HOMEAPP_WEB_IMAGE:-ghcr\.io\/streight1\/home-app-web\}:\$\{APP_IMAGE_TAG:-staging\}/,
  'Gateway musí používat GHCR web image.',
);
forbidPattern(api, /^\s+ports:/m, 'API nesmí publikovat host port.');
forbidPattern(database, /^\s+ports:/m, 'DB nesmí publikovat host port.');
requirePattern(
  gateway,
  /ports:\s*\n\s+- ['"]80:80['"]\s*\n\s+- ['"]443:443['"]/,
  'Gateway musí jako jediná služba publikovat 80/443.',
);
forbidPattern(
  gateway,
  /uploads_data|\/app\/uploads/,
  'Gateway nesmí mít přístup k uploads volume.',
);

requirePattern(
  compose,
  /name:\s*\$\{POSTGRES_VOLUME_NAME:-homeapp_postgres_data\}/,
  'PostgreSQL named volume musí mít stabilní výchozí název.',
);
for (const volume of [
  'homeapp_uploads_data',
  'homeapp_caddy_data',
  'homeapp_caddy_config',
  'homeapp_backups',
  'homeapp_runtime_secrets',
]) {
  requirePattern(
    compose,
    new RegExp(`name:\\s*\\$\\{[A-Z_]+:-${volume}\\}`),
    `Chybí stabilní named volume ${volume}.`,
  );
}
requirePattern(
  volumesInit,
  /chown -R "\$\$\{APP_RUNTIME_UID\}:\$\$\{APP_RUNTIME_GID\}" \/uploads/,
  'volumes-init musí idempotentně nastavit vlastníka uploads.',
);
requirePattern(
  api,
  /volumes-init:[\s\S]*condition:\s*service_completed_successfully/,
  'API musí čekat na úspěšný volumes-init.',
);
requirePattern(
  compose,
  /runtime_secrets:\/run\/homeapp-secrets:ro/,
  'API a migrace musí číst runtime kopii secrets jen read-only.',
);
requirePattern(
  volumesInit,
  /install -m 0440[\s\S]*\/runtime-secrets/,
  'volumes-init musí zpřístupnit secrets neprivilegovanému runtime UID.',
);

requirePattern(
  database,
  /POSTGRES_PASSWORD_FILE:\s*\/run\/secrets\/postgres_password/,
  'DB musí číst heslo z Compose secret souboru.',
);
requirePattern(
  database,
  /healthcheck:[\s\S]*pg_isready/,
  'DB musí mít pg_isready healthcheck.',
);
requirePattern(
  migrate,
  /db:[\s\S]*condition:\s*service_healthy/,
  'Migrate musí čekat na healthy DB.',
);
requirePattern(
  migrate,
  /run-migrations\.mjs[\s\S]*restart:\s*['"]no['"]/,
  'Migrate musí být one-shot prisma migrate deploy runner.',
);
requirePattern(
  api,
  /migrate:[\s\S]*condition:\s*service_completed_successfully/,
  'API se smí spustit pouze po úspěšné migraci.',
);
requirePattern(
  api,
  /read_only:\s*true/,
  'API musí mít read-only root filesystem.',
);
requirePattern(
  api,
  /user:\s*['"]\$\{APP_RUNTIME_UID:-10001\}/,
  'API musí běžet jako explicitní neprivilegovaný uživatel.',
);
requirePattern(
  api,
  /healthcheck:[\s\S]*\/app\/bin\/healthcheck\.mjs/,
  'API musí mít secret-file-aware healthcheck.',
);
requirePattern(
  gateway,
  /api:[\s\S]*condition:\s*service_healthy/,
  'Gateway musí čekat na healthy API.',
);

requirePattern(
  webIndex,
  /runtime-config\.js[\s\S]*type="module" src="\/src\/main\.tsx"/,
  'Runtime config musí být načtený před React bootstrapem.',
);
requirePattern(
  webEnvironment,
  /runtimeConfig\s*=\s*window\.__HOMEAPP_CONFIG__[\s\S]*isProduction:\s*import\.meta\.env\.PROD\s*\|\|\s*runtimeConfig\s*!=\s*null/,
  'Produkční frontend musí používat window.__HOMEAPP_CONFIG__.',
);
requirePattern(
  runtimeConfig,
  /PUBLIC_RUNTIME_FIELDS[\s\S]*nepovolené pole/,
  'Frontend musí runtime config validovat allowlistem.',
);
forbidPattern(
  gatewayEntrypoint,
  /DATABASE_URL|POSTGRES_PASSWORD|MAPY_API_KEY|INTERNAL_HEALTH_TOKEN/,
  'Generátor veřejného runtime configu nesmí pracovat s backend secrets.',
);
requirePattern(
  caddy,
  /handle \/runtime-config\.js[\s\S]*Cache-Control "no-store/,
  'Runtime config nesmí být cachovaný.',
);
forbidPattern(
  webDockerfile,
  /ARG VITE_(?:API_URL|GOOGLE_CLIENT_ID|APP_ENV_LABEL|MAX_UPLOAD_BYTES)/,
  'Gateway image nesmí vyžadovat deployment-specific Vite build args.',
);

for (const secret of [
  'postgres_password',
  'internal_health_token',
  'mapy_api_key',
]) {
  requirePattern(
    compose,
    new RegExp(`${secret}:[\\s\\S]*?file:`),
    `Compose musí definovat secret ${secret}.`,
  );
}
requirePattern(
  secretResolver,
  /_FILE[\s\S]*readSecretFile[\s\S]*POSTGRES_PASSWORD/,
  'API musí dávat *_FILE secrets přednost před env fallbackem.',
);
requirePattern(
  migrationRunner,
  /resolveSecretEnvironment[\s\S]*\['migrate', 'deploy'\]/,
  'Migration runner musí spouštět prisma migrate deploy se secret resolverem.',
);
requirePattern(
  healthcheck,
  /INTERNAL_HEALTH_TOKEN_FILE[\s\S]*X-Internal-Health-Token/,
  'Healthcheck musí číst interní token ze secret souboru.',
);

requirePattern(
  backupService,
  /profiles:[\s\S]*maintenance[\s\S]*uploads_data:\/uploads:ro[\s\S]*backups:\/backups/,
  'Backup musí být volitelný profil s read-only uploads a backup volume.',
);
requirePattern(
  backup,
  /pg_dump[\s\S]*uploads\.tar\.gz[\s\S]*manifest\.txt[\s\S]*SHA256SUMS/,
  'Kontejnerový backup musí vytvořit logical dump, uploads archiv a manifest.',
);
requirePattern(
  restoreOverride,
  /uploads_data:\/uploads/,
  'Restore override musí explicitně povolit zápis do uploads.',
);
requirePattern(
  restore,
  /RESTORE_CONFIRM[\s\S]*sha256sum --check[\s\S]*pg_restore/,
  'Restore musí vyžadovat potvrzení, ověřit checksumy a použít pg_restore.',
);

requirePattern(
  migration,
  /--dry-run\|--execute[\s\S]*backup-vps\.sh[\s\S]*pg_restore[\s\S]*upload_manifest/,
  'Migrace bind mountů musí podporovat dry-run, pg_dump backup a ověření uploads.',
);
forbidPattern(
  migration,
  /\bdown\s+(?:.*\s)?-v\b|docker\s+volume\s+rm/,
  'Migrační skript nesmí mazat volumes ani původní data.',
);

requirePattern(
  workflow,
  /permissions:\s*\n\s+contents:\s*read[\s\S]*packages:\s*write/,
  'Publish workflow musí používat minimální contents/packages oprávnění.',
);
requirePattern(
  workflow,
  /quality-static:[\s\S]*api-tests:[\s\S]*web-tests:[\s\S]*browser-accessibility-tests:[\s\S]*browser-visual-tests:[\s\S]*container-validation:/,
  'Workflow musí před publikací oddělit statické, API, web, browser accessibility, browser visual a container kontroly.',
);
requirePattern(
  workflow,
  /needs:[\s\S]*quality-static[\s\S]*api-tests[\s\S]*web-tests[\s\S]*browser-accessibility-tests[\s\S]*browser-visual-tests[\s\S]*container-validation/,
  'Publish musí čekat na všechny validační joby.',
);
requirePattern(
  workflow,
  /resolve-image-reference\.mjs[\s\S]*type=raw,value=staging[\s\S]*type=sha,format=long[\s\S]*type=ref,event=tag[\s\S]*type=semver,pattern=\{\{major\}\}\.\{\{minor\}\}/,
  'Workflow musí používat image manifest a vytvářet staging, full SHA a release tagy.',
);
const actionUses = [...workflow.matchAll(/^\s+uses:\s*[^@\s]+@([^\s#]+)/gm)];
if (
  actionUses.length === 0 ||
  actionUses.some((match) => !/^[0-9a-f]{40}$/.test(match[1] ?? ''))
) {
  errors.push('Všechny GitHub Actions musí být připnuté na úplný commit SHA.');
}

requirePattern(
  apiDockerfile,
  /COPY deployment\/api \.\/bin/,
  'API image musí obsahovat migration a health runtime nástroje.',
);
requirePattern(
  webDockerfile,
  /ENTRYPOINT \["\/usr\/local\/bin\/homeapp-gateway-entrypoint"\]/,
  'Gateway image musí generovat runtime config vlastním entrypointem.',
);
forbidPattern(
  `${compose}\n${apiDockerfile}\n${webDockerfile}`,
  /nest start --watch|vite --host|prisma migrate (?:dev|reset)|test-auth|SwaggerModule/,
  'Registry deployment nesmí zapnout watch, dev migrace, test auth ani Swagger.',
);
requirePattern(
  caddy,
  /@uploads path \/uploads\/\*[\s\S]*respond 404/,
  'Gateway musí odmítat veřejné /uploads.',
);
requirePattern(
  caddy,
  /@internal path \/internal\/\*[\s\S]*respond 404/,
  'Gateway nesmí zveřejnit interní health endpointy.',
);

if (errors.length > 0) {
  console.error(
    `Kontejnerová deployment kontrola selhala:\n- ${errors.join('\n- ')}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    'Kontejnerová deployment kontrola prošla (registry image, volumes, migrace, runtime config a secrets).',
  );
}
