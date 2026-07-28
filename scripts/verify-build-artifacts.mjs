import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const target = process.argv[2] ?? 'all';
const errors = [];

async function assertFile(path, minimumBytes = 1) {
  try {
    const file = await stat(join(root, path));
    if (!file.isFile() || file.size < minimumBytes)
      errors.push(`${path} je prázdný nebo není soubor.`);
  } catch {
    errors.push(`${path} chybí.`);
  }
}

if (target === 'api' || target === 'all') {
  await assertFile('apps/api/dist/main.js', 1_000);
  await assertFile('apps/api/src/generated/prisma/client.ts', 1_000);
  await assertFile(
    'apps/api/prisma/migrations/20260727120000_calendar_colors_all_day_bulk/migration.sql',
    1_000,
  );
}

if (target === 'web' || target === 'all') {
  await assertFile('apps/web/dist/index.html', 100);
  const index = await readFile(join(root, 'apps/web/dist/index.html'), 'utf8');
  if (!index.includes('/runtime-config.js'))
    errors.push('Produkční index nenačítá runtime-config.js.');

  const assets = await readdir(join(root, 'apps/web/dist/assets'));
  const forbidden = [
    'DATABASE_URL',
    'POSTGRES_PASSWORD',
    'INTERNAL_HEALTH_TOKEN',
    'MAPY_API_KEY',
    '000000000000-ci.apps.googleusercontent.com',
  ];
  for (const asset of assets.filter((name) => name.endsWith('.js'))) {
    const source = await readFile(
      join(root, 'apps/web/dist/assets', asset),
      'utf8',
    );
    for (const secretName of forbidden) {
      if (source.includes(secretName))
        errors.push(`Browser bundle ${asset} obsahuje zakázaný secret název.`);
    }
  }
}

if (errors.length) {
  console.error(`Kontrola build artefaktů selhala:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Build artefakty pro ${target} odpovídají produkčnímu kontraktu.`,
  );
}
