import { spawn } from 'node:child_process';
import process from 'node:process';
import { resolveSecretEnvironment } from '../apps/api/dist/config/secret-file-resolver.js';

const resolved = resolveSecretEnvironment(process.env);
const databaseUrl = resolved.DATABASE_URL;
if (typeof databaseUrl !== 'string' || !databaseUrl) {
  console.error('Migration configuration is missing DATABASE_URL.');
  process.exit(1);
}

const child = spawn(
  '/app/apps/api/node_modules/.bin/prisma',
  ['migrate', 'deploy'],
  {
    cwd: '/app/apps/api',
    env: { ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: 'production' },
    stdio: 'inherit',
  },
);

child.on('error', () => {
  console.error('Prisma migration process could not be started.');
  process.exit(1);
});
child.on('exit', (code, signal) => {
  if (signal) {
    console.error('Prisma migration process was interrupted.');
    process.exit(1);
  }
  process.exit(code ?? 1);
});
