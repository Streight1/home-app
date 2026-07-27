import type {
  HomeAppPublicRuntimeConfig,
  WebEnvironment,
} from './runtime-config.types.js';

const DEFAULT_MAX_UPLOAD_BYTES = 26_214_400;
const DEFAULT_FINANCE_IMPORT_MAX_FILE_BYTES = 20_971_520;
const PUBLIC_RUNTIME_FIELDS = new Set([
  'API_URL',
  'GOOGLE_CLIENT_ID',
  'APP_ENV_LABEL',
  'MAX_UPLOAD_BYTES',
  'FINANCE_IMPORT_MAX_FILE_BYTES',
  'CSRF_COOKIE_NAME',
]);

function isApiUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//'))
    return !value.includes('?') && !value.includes('#');
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function readPositiveInteger(
  value: unknown,
  field: string,
  fallback?: number,
): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  if (fallback !== undefined) return fallback;
  throw new Error(`${field} musí být kladné celé číslo.`);
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${field} není nastavené.`);
  return value.trim();
}

export function parseRuntimeConfig(input: unknown): HomeAppPublicRuntimeConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Veřejná runtime konfigurace není dostupná.');

  const source = input as Record<string, unknown>;
  const unexpectedField = Object.keys(source).find(
    (field) => !PUBLIC_RUNTIME_FIELDS.has(field),
  );
  if (unexpectedField)
    throw new Error('Veřejná runtime konfigurace obsahuje nepovolené pole.');
  const apiUrl = readRequiredString(source.API_URL, 'API_URL');
  const googleClientId = readRequiredString(
    source.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_ID',
  );
  const appEnvLabel =
    typeof source.APP_ENV_LABEL === 'string' ? source.APP_ENV_LABEL.trim() : '';
  const csrfCookieName = readRequiredString(
    source.CSRF_COOKIE_NAME,
    'CSRF_COOKIE_NAME',
  );

  if (!apiUrl.startsWith('/') || apiUrl.startsWith('//'))
    throw new Error('API_URL musí být same-origin cesta.');
  if (apiUrl.includes('?') || apiUrl.includes('#'))
    throw new Error('API_URL obsahuje nepovolenou část.');
  if (!/^[A-Za-z0-9._-]+\.apps\.googleusercontent\.com$/.test(googleClientId))
    throw new Error('GOOGLE_CLIENT_ID nemá očekávaný bezpečný formát.');
  if (!/^[A-Za-z0-9_-]+$/.test(csrfCookieName))
    throw new Error('CSRF_COOKIE_NAME obsahuje nepovolené znaky.');
  if (appEnvLabel.length > 32)
    throw new Error('APP_ENV_LABEL smí mít nejvýše 32 znaků.');

  return {
    API_URL: apiUrl.replace(/\/$/, ''),
    GOOGLE_CLIENT_ID: googleClientId,
    APP_ENV_LABEL: appEnvLabel,
    MAX_UPLOAD_BYTES: readPositiveInteger(
      source.MAX_UPLOAD_BYTES,
      'MAX_UPLOAD_BYTES',
    ),
    FINANCE_IMPORT_MAX_FILE_BYTES: readPositiveInteger(
      source.FINANCE_IMPORT_MAX_FILE_BYTES,
      'FINANCE_IMPORT_MAX_FILE_BYTES',
    ),
    CSRF_COOKIE_NAME: csrfCookieName,
  };
}

export function resolveWebEnvironment(options: {
  isProduction: boolean;
  runtimeConfig: unknown;
  viteEnvironment: Record<string, unknown>;
}): WebEnvironment {
  if (options.isProduction) {
    const runtime = parseRuntimeConfig(options.runtimeConfig);
    return {
      apiUrl: runtime.API_URL,
      googleClientId: runtime.GOOGLE_CLIENT_ID,
      appEnvLabel: runtime.APP_ENV_LABEL || null,
      maxUploadBytes: runtime.MAX_UPLOAD_BYTES,
      financeImportMaxFileBytes: runtime.FINANCE_IMPORT_MAX_FILE_BYTES,
      csrfCookieName: runtime.CSRF_COOKIE_NAME,
    };
  }

  const vite = options.viteEnvironment;
  const apiUrl = readRequiredString(vite.VITE_API_URL, 'VITE_API_URL');
  const googleClientId = readRequiredString(
    vite.VITE_GOOGLE_CLIENT_ID,
    'VITE_GOOGLE_CLIENT_ID',
  );
  const csrfCookieName = readRequiredString(
    vite.VITE_CSRF_COOKIE_NAME,
    'VITE_CSRF_COOKIE_NAME',
  );
  if (!isApiUrl(apiUrl))
    throw new Error(
      'VITE_API_URL musí být same-origin cesta nebo HTTP(S) adresa.',
    );
  if (!/^[A-Za-z0-9_-]+$/.test(csrfCookieName))
    throw new Error('VITE_CSRF_COOKIE_NAME obsahuje nepovolené znaky.');

  const label =
    typeof vite.VITE_APP_ENV_LABEL === 'string'
      ? vite.VITE_APP_ENV_LABEL.trim().slice(0, 32)
      : '';
  return {
    apiUrl: apiUrl.replace(/\/$/, ''),
    googleClientId,
    csrfCookieName,
    maxUploadBytes: readPositiveInteger(
      vite.VITE_MAX_UPLOAD_BYTES,
      'VITE_MAX_UPLOAD_BYTES',
      DEFAULT_MAX_UPLOAD_BYTES,
    ),
    financeImportMaxFileBytes: readPositiveInteger(
      vite.VITE_FINANCE_IMPORT_MAX_FILE_BYTES,
      'VITE_FINANCE_IMPORT_MAX_FILE_BYTES',
      DEFAULT_FINANCE_IMPORT_MAX_FILE_BYTES,
    ),
    appEnvLabel: label || null,
  };
}
