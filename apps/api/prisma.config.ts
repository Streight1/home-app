import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config as loadEnvironment } from 'dotenv';
import { expand } from 'dotenv-expand';
import { defineConfig, env } from 'prisma/config';

const environmentFile = fileURLToPath(new URL('../../.env', import.meta.url));

if (existsSync(environmentFile)) {
  const result = loadEnvironment({ path: environmentFile, quiet: true });
  if (result.error) throw result.error;
  expand(result);
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
