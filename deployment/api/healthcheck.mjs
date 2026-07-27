import { readFile } from 'node:fs/promises';
import process from 'node:process';

async function main() {
  const path = process.env.INTERNAL_HEALTH_TOKEN_FILE;
  if (!path) throw new Error('health token file is missing');
  const token = (await readFile(path, 'utf8')).replace(/[\r\n]+$/, '');
  if (token.length < 32) throw new Error('health token is invalid');

  const response = await fetch('http://127.0.0.1:3000/internal/health/ready', {
    headers: { 'X-Internal-Health-Token': token },
    signal: AbortSignal.timeout(4_000),
  });
  if (!response.ok) throw new Error('API is not ready');
}

main().catch(() => process.exit(1));
