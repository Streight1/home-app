import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../src/config/app-config.schema.js';

const validEnvironment = {
  NODE_ENV: 'development',
  API_PORT: '3000',
  DATABASE_URL: 'postgresql://life_admin:password@localhost:5432/life_admin',
  WEB_ORIGIN: 'http://localhost:5173',
  GOOGLE_CLIENT_ID: 'client.apps.googleusercontent.com',
  GOOGLE_ALLOWED_EMAILS: '',
  SESSION_COOKIE_NAME: 'life_admin_session',
  CSRF_COOKIE_NAME: 'life_admin_csrf',
  SESSION_TTL_DAYS: '30',
  TRUST_PROXY: 'false',
  INTERNAL_HEALTH_TOKEN: '12345678901234567890123456789012',
  UPLOAD_ROOT: 'uploads',
  MAX_UPLOAD_BYTES: '26214400',
  FINANCE_IMPORT_MAX_FILE_BYTES: '20971520',
  FINANCE_IMPORT_MAX_ROWS: '100000',
  FINANCE_IMPORT_SESSION_TTL_HOURS: '24',
};

describe('app configuration', () => {
  it.each([undefined, 'too-short'])(
    'rejects invalid INTERNAL_HEALTH_TOKEN %s',
    (token) => {
      expect(() =>
        validateEnvironment({
          ...validEnvironment,
          INTERNAL_HEALTH_TOKEN: token,
        }),
      ).toThrow('Neplatná konfigurace prostředí');
    },
  );

  it('accepts a complete development configuration', () => {
    expect(validateEnvironment(validEnvironment)).toMatchObject({
      API_PORT: 3000,
      CSRF_COOKIE_NAME: 'life_admin_csrf',
      INTERNAL_HEALTH_TOKEN: validEnvironment.INTERNAL_HEALTH_TOKEN,
      MAX_UPLOAD_BYTES: 26_214_400,
      FINANCE_IMPORT_MAX_FILE_BYTES: 20_971_520,
      FINANCE_IMPORT_MAX_ROWS: 100_000,
    });
  });

  it('uses conservative finance import limits for an older local environment', () => {
    expect(
      validateEnvironment({
        ...validEnvironment,
        FINANCE_IMPORT_MAX_FILE_BYTES: undefined,
        FINANCE_IMPORT_MAX_ROWS: undefined,
        FINANCE_IMPORT_SESSION_TTL_HOURS: undefined,
      }),
    ).toMatchObject({
      FINANCE_IMPORT_MAX_FILE_BYTES: 20_971_520,
      FINANCE_IMPORT_MAX_ROWS: 100_000,
      FINANCE_IMPORT_SESSION_TTL_HOURS: 24,
    });
  });

  it.each(['SESSION_COOKIE_NAME', 'CSRF_COOKIE_NAME'] as const)(
    'rejects an unsafe cookie name in %s',
    (key) => {
      expect(() =>
        validateEnvironment({ ...validEnvironment, [key]: 'unsafe cookie' }),
      ).toThrow('Neplatná konfigurace prostředí');
    },
  );

  it('requires a Mapy API key only when the integration is enabled', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        MAPY_API_ENABLED: 'true',
        MAPY_API_KEY: '',
      }),
    ).toThrow('Neplatná konfigurace prostředí');
    expect(
      validateEnvironment({
        ...validEnvironment,
        MAPY_API_ENABLED: 'true',
        MAPY_API_KEY: 'development-provider-key',
      }).MAPY_API_ENABLED,
    ).toBe(true);
  });

  it.each([
    ['MAPY_API_TIMEOUT_MS', '0'],
    ['MAPY_SUGGEST_MIN_QUERY_LENGTH', '1'],
    ['MAPY_SUGGEST_MAX_RESULTS', '16'],
  ] as const)('rejects unsafe Mapy configuration %s=%s', (key, value) => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, [key]: value }),
    ).toThrow('Neplatná konfigurace prostředí');
  });
});
