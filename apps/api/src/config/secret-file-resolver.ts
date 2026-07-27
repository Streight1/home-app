import { readFileSync, statSync } from 'node:fs';

const MAX_SECRET_BYTES = 65_536;

function readSecretFile(path: string, variableName: string): string {
  let statistics;
  try {
    statistics = statSync(path);
  } catch {
    throw new Error(`${variableName} odkazuje na nedostupný secret soubor.`);
  }
  if (!statistics.isFile() || statistics.size > MAX_SECRET_BYTES)
    throw new Error(`${variableName} neodkazuje na platný secret soubor.`);

  const value = readFileSync(path, 'utf8').replace(/[\r\n]+$/, '');
  if (!value || value.includes('\0') || /[\r\n]/.test(value))
    throw new Error(`${variableName} obsahuje neplatnou secret hodnotu.`);
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolveSecret(
  input: Record<string, unknown>,
  name: string,
): string | undefined {
  const fileVariable = `${name}_FILE`;
  const file = optionalString(input[fileVariable]);
  if (file) return readSecretFile(file, fileVariable);
  return optionalString(input[name]);
}

function buildDatabaseUrl(
  input: Record<string, unknown>,
  password: string,
): string {
  const host = optionalString(input.POSTGRES_HOST) ?? 'db';
  const port = optionalString(input.POSTGRES_PORT) ?? '5432';
  const database = optionalString(input.POSTGRES_DB);
  const user = optionalString(input.POSTGRES_USER);
  if (!database || !user)
    throw new Error(
      'DATABASE_URL nebo POSTGRES_DB, POSTGRES_USER a POSTGRES_PASSWORD_FILE musí být nastavené.',
    );
  if (!/^[1-9][0-9]{0,4}$/.test(port))
    throw new Error('POSTGRES_PORT nemá platný formát.');

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}?schema=public`;
}

export function resolveSecretEnvironment(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const resolved = { ...input };
  const databaseUrl = resolveSecret(input, 'DATABASE_URL');
  const postgresPassword = resolveSecret(input, 'POSTGRES_PASSWORD');
  const internalHealthToken = resolveSecret(input, 'INTERNAL_HEALTH_TOKEN');
  const mapyApiKey = resolveSecret(input, 'MAPY_API_KEY');

  if (databaseUrl) resolved.DATABASE_URL = databaseUrl;
  else if (postgresPassword)
    resolved.DATABASE_URL = buildDatabaseUrl(input, postgresPassword);
  if (internalHealthToken) resolved.INTERNAL_HEALTH_TOKEN = internalHealthToken;
  if (mapyApiKey) resolved.MAPY_API_KEY = mapyApiKey;

  return resolved;
}
