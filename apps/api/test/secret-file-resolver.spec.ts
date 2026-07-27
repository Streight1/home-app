import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveSecretEnvironment } from '../src/config/secret-file-resolver.js';

const temporaryDirectories: string[] = [];

async function secretFile(name: string, value: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'homeapp-secrets-'));
  temporaryDirectories.push(directory);
  const path = join(directory, name);
  await writeFile(path, value, { mode: 0o600 });
  return path;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe('secret file resolver', () => {
  it('prefers secret files over environment fallbacks', async () => {
    const tokenFile = await secretFile(
      'internal-health-token',
      `${'f'.repeat(32)}\n`,
    );
    expect(
      resolveSecretEnvironment({
        INTERNAL_HEALTH_TOKEN: 'environment-fallback',
        INTERNAL_HEALTH_TOKEN_FILE: tokenFile,
      }).INTERNAL_HEALTH_TOKEN,
    ).toBe('f'.repeat(32));
  });

  it('constructs an encoded database URL from the PostgreSQL secret', async () => {
    const passwordFile = await secretFile('postgres-password', 'p@ss/word\n');
    expect(
      resolveSecretEnvironment({
        POSTGRES_HOST: 'db',
        POSTGRES_PORT: '5432',
        POSTGRES_DB: 'homeapp',
        POSTGRES_USER: 'homeapp',
        POSTGRES_PASSWORD_FILE: passwordFile,
      }).DATABASE_URL,
    ).toBe('postgresql://homeapp:p%40ss%2Fword@db:5432/homeapp?schema=public');
  });

  it('does not expose a secret value in file errors', () => {
    expect(() =>
      resolveSecretEnvironment({
        INTERNAL_HEALTH_TOKEN_FILE: '/missing/homeapp-secret',
      }),
    ).toThrow('INTERNAL_HEALTH_TOKEN_FILE');
  });

  it('rejects multiline secret content', async () => {
    const tokenFile = await secretFile('invalid-token', 'first\nsecond\n');
    expect(() =>
      resolveSecretEnvironment({ INTERNAL_HEALTH_TOKEN_FILE: tokenFile }),
    ).toThrow('neplatnou secret hodnotu');
  });
});
