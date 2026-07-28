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
    errors.push(`compose.prod.yaml postrádá službu ${service}.`);
    return '';
  }
  return match[1];
}

const [
  compose,
  caddy,
  apiDockerfile,
  webDockerfile,
  deployScript,
  backupScript,
  restoreScript,
  runtimeConfig,
  sessionCookie,
  apiMain,
] = await Promise.all([
  read('compose.prod.yaml'),
  read('deployment/Caddyfile'),
  read('apps/api/Dockerfile'),
  read('apps/web/Dockerfile'),
  read('scripts/deploy-vps.sh'),
  read('scripts/backup-vps.sh'),
  read('scripts/restore-vps.sh'),
  read('apps/web/src/lib/config/runtime-config.ts'),
  read('apps/api/src/modules/auth/session/session-cookie.service.ts'),
  read('apps/api/src/main.ts'),
]);

const gateway = serviceBlock(compose, 'gateway');
const api = serviceBlock(compose, 'api');
const migrate = serviceBlock(compose, 'migrate');
const database = serviceBlock(compose, 'db');

requirePattern(
  gateway,
  /ports:\s*\n\s+- ['"]80:80['"]\s*\n\s+- ['"]443:443['"]/,
  'Gateway musí publikovat TCP porty 80 a 443.',
);
forbidPattern(
  gateway,
  /(?:source|target):\s*.*uploads|\.\/uploads/,
  'Gateway nesmí mít mount uploads.',
);
forbidPattern(api, /^\s+ports:/m, 'API nesmí publikovat host port.');
forbidPattern(
  database,
  /^\s+ports:/m,
  'PostgreSQL nesmí publikovat host port.',
);
requirePattern(
  database,
  /source:\s*\.\/database\/postgres[\s\S]*target:\s*\/var\/lib\/postgresql/,
  'PostgreSQL musí používat bind mount database/postgres.',
);
requirePattern(
  api,
  /source:\s*\.\/uploads[\s\S]*target:\s*\/app\/uploads/,
  'Uploads musí být mountované pouze do API.',
);
requirePattern(
  compose,
  /NODE_ENV:\s*production/,
  'API musí běžet s NODE_ENV=production.',
);
requirePattern(
  compose,
  /TRUST_PROXY:\s*['"]true['"]/,
  'API musí za Caddy vynucovat TRUST_PROXY=true.',
);
requirePattern(
  api,
  /user:\s*['"]\$\{APP_RUNTIME_UID/,
  'API musí běžet pod explicitním neprivilegovaným UID/GID.',
);
requirePattern(
  migrate,
  /target:\s*migrate/,
  'Migrate služba musí používat samostatný image target.',
);
requirePattern(
  apiDockerfile,
  /CMD \["\.\/node_modules\/\.bin\/prisma", "migrate", "deploy"\]/,
  'Migrate image musí používat prisma migrate deploy.',
);
forbidPattern(
  apiDockerfile,
  /migrate\s+(?:dev|reset)|nest\s+start\s+--watch/,
  'Produkční API image nesmí používat migrate dev/reset ani watch režim.',
);
requirePattern(
  webDockerfile,
  /FROM caddy:2\.[0-9.]+-alpine AS gateway/,
  'Frontend runtime musí používat Caddy, ne Vite server.',
);
forbidPattern(
  webDockerfile.split(/FROM caddy:/)[1] ?? '',
  /\b(?:vite|node_modules|pnpm)\b/,
  'Gateway runtime nesmí obsahovat Vite ani workspace node_modules.',
);
forbidPattern(
  apiDockerfile,
  /COPY\s+(?:\.|apps\/api\/test|apps\/web\/e2e)\s/,
  'Produkční API stage nesmí kopírovat celý workspace nebo test fixtures.',
);

requirePattern(caddy, /handle \/api\/\*/, 'Caddy musí proxyovat pouze /api/*.');
requirePattern(
  caddy,
  /reverse_proxy api:3000/,
  'Caddy musí proxyovat API na interní službu api:3000.',
);
requirePattern(
  caddy,
  /@internal path \/internal\/\*[\s\S]*handle @internal \{[\s\S]*respond 404/,
  'Interní health endpointy musí být na gateway explicitně blokované.',
);
requirePattern(
  caddy,
  /@uploads path \/uploads\/\*[\s\S]*handle @uploads \{[\s\S]*respond 404/,
  'Gateway musí explicitně odmítat /uploads/*.',
);
requirePattern(
  caddy,
  /try_files \{path\} \/index\.html/,
  'Caddy musí poskytovat SPA fallback pro /login a /app.',
);
requirePattern(
  caddy,
  /Content-Security-Policy/,
  'Gateway musí posílat Content-Security-Policy.',
);
forbidPattern(
  caddy,
  /reverse_proxy\s+.*internal|file_server\s+.*uploads/,
  'Gateway nesmí proxyovat interní health ani staticky publikovat uploads.',
);

requirePattern(
  compose,
  /VITE_API_URL:\s*\/api\/v1/,
  'Produkční frontend musí být sestavený s relativním /api/v1.',
);
requirePattern(
  runtimeConfig,
  /apiUrl\.startsWith\('\/'\)[\s\S]*apiUrl\.startsWith\('\/\/'\)/,
  'Veřejný runtime config musí explicitně vynucovat same-origin API cestu.',
);
requirePattern(
  sessionCookie,
  /secure:\s*this\.config\.isProduction/,
  'Session cookies musí být v production secure.',
);
requirePattern(
  apiMain,
  /expressApplication\.set\('trust proxy'/,
  'NestJS musí aplikovat validovanou trust proxy konfiguraci.',
);
forbidPattern(
  `${compose}\n${apiDockerfile}\n${webDockerfile}`,
  /(?:replace-with|homeapp_local_password|INTERNAL_HEALTH_TOKEN:\s*[A-Za-z0-9_-]{32,})/,
  'Produkční definice nesmí obsahovat hardcoded secret nebo vývojové heslo.',
);
forbidPattern(
  `${compose}\n${apiDockerfile}`,
  /(?:SwaggerModule|\/api\/docs|test-auth|seed-endpoint|prisma studio)/i,
  'Produkční konfigurace nesmí zapnout Swagger, test auth, seed ani Prisma Studio.',
);

for (const [name, script] of [
  ['deploy-vps.sh', deployScript],
  ['backup-vps.sh', backupScript],
  ['restore-vps.sh', restoreScript],
]) {
  requirePattern(
    script,
    /--dry-run/,
    `${name} musí podporovat bezpečný --dry-run.`,
  );
  forbidPattern(
    script,
    /\bdown\s+(?:.*\s)?-v\b|docker\s+volume\s+rm/,
    `${name} nesmí mazat Docker volumes.`,
  );
}
requirePattern(
  deployScript,
  /backup-vps\.sh[\s\S]*vps_compose build[\s\S]*up -d db[\s\S]*run --rm migrate[\s\S]*up -d api/,
  'Deploy musí zachovat pořadí backup → build → DB → migrace → API.',
);
requirePattern(
  backupScript,
  /\bpg_dump\b[\s\S]*uploads\.tar\.gz[\s\S]*SHA256SUMS/,
  'Backup musí obsahovat logical dump, uploads archiv a checksumy.',
);
forbidPattern(
  backupScript,
  /tar[\s\S]{0,100}database\/postgres/,
  'Backup nesmí archivovat živý PostgreSQL datový adresář.',
);
requirePattern(
  restoreScript,
  /sha256sum --check[\s\S]*vps_compose stop gateway api[\s\S]*pg_restore/,
  'Restore musí ověřit checksumy a zastavit zapisující aplikaci.',
);

if (errors.length > 0) {
  console.error(`Deployment kontrola selhala:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    'Deployment kontrola prošla (produkční Compose, image a skripty).',
  );
}
