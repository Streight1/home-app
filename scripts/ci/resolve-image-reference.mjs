import { readFile } from 'node:fs/promises';
import process from 'node:process';

const component = process.argv[2];
const manifest = JSON.parse(
  await readFile(
    new URL('../../deployment/images.json', import.meta.url),
    'utf8',
  ),
);
const value =
  component === 'api'
    ? manifest.api
    : component === 'web'
      ? manifest.web
      : null;
if (typeof value !== 'string' || !value.startsWith('ghcr.io/')) {
  console.error('Neznámá nebo neplatná image komponenta.');
  process.exit(1);
}
process.stdout.write(value);
