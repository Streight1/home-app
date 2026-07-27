import { access, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const generatedRoot = join(root, 'apps/api/src/generated/prisma');
const schemaPath = join(root, 'apps/api/prisma/schema.prisma');
const requiredArtifacts = [
  ['client.ts', 1_000],
  ['browser.ts', 1_000],
  ['models.ts', 1_000],
  ['models/User.ts', 10_000],
];
const errors = [];

const schema = await stat(schemaPath);
for (const [relativePath, minimumBytes] of requiredArtifacts) {
  const path = join(generatedRoot, relativePath);
  try {
    await access(path);
    const artifact = await stat(path);
    if (artifact.size < minimumBytes)
      errors.push(`${relativePath} je neočekávaně malý.`);
    if (artifact.mtimeMs + 1_000 < schema.mtimeMs)
      errors.push(`${relativePath} je starší než Prisma schema.`);
  } catch {
    errors.push(`${relativePath} nebyl vygenerován.`);
  }
}

const prismaService = await readFile(
  join(root, 'apps/api/src/infrastructure/database/prisma.service.ts'),
  'utf8',
);
if (!prismaService.includes('../../generated/prisma/client.js'))
  errors.push(
    'PrismaService neimportuje kanonický generovaný client entrypoint.',
  );

if (errors.length) {
  console.error(`Kontrola Prisma artefaktů selhala:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    'Generovaný Prisma Client je úplný, aktuální a používá kanonický entrypoint.',
  );
}
