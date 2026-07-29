import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const metadataPath = join(root, 'apps/web/e2e/visual-baseline.json');
const snapshotDirectory = join(root, 'apps/web/e2e/visual.spec.ts-snapshots');
const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
const snapshots = (await readdir(snapshotDirectory)).filter((name) =>
  name.endsWith('.png'),
);

if (
  snapshots.some((name) => !name.endsWith(`-${metadata.snapshotPlatform}.png`))
) {
  throw new Error(
    'Nelze aktualizovat metadata: snapshot používá neočekávaný platform suffix.',
  );
}

metadata.snapshotCount = snapshots.length;
metadata.lastReviewedAt = new Date().toISOString().slice(0, 10);
await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

console.log(
  `Metadata baseline aktualizována: ${String(metadata.snapshotCount)} PNG.`,
);
