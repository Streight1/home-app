import { describe, expect, it } from 'vitest';
import { TEST_PUBLIC_RUNTIME_CONFIG } from './test-runtime-config.js';
import { parseRuntimeConfig, resolveWebEnvironment } from './runtime-config.js';

const runtimeConfig = { ...TEST_PUBLIC_RUNTIME_CONFIG };

describe('public runtime configuration', () => {
  it('validates the public production values', () => {
    expect(parseRuntimeConfig(runtimeConfig)).toEqual(runtimeConfig);
    expect(runtimeConfig.API_URL).toBe('/api/v1');
  });

  it('rejects missing, malformed and secret-shaped configuration', () => {
    expect(() => parseRuntimeConfig(null)).toThrow('není dostupná');
    expect(() =>
      parseRuntimeConfig({ ...runtimeConfig, API_URL: 'javascript:alert(1)' }),
    ).toThrow('API_URL');
    expect(() =>
      parseRuntimeConfig({
        ...runtimeConfig,
        CSRF_COOKIE_NAME: 'unsafe cookie',
      }),
    ).toThrow('CSRF_COOKIE_NAME');
  });

  it('fails safely when the browser runtime config is missing', () => {
    expect(() => parseRuntimeConfig(undefined)).toThrow('není dostupná');
  });

  it('uses runtime values in production without a Vite rebuild', () => {
    const first = resolveWebEnvironment({
      isProduction: true,
      runtimeConfig,
      viteEnvironment: {},
    });
    const second = resolveWebEnvironment({
      isProduction: true,
      runtimeConfig: {
        ...runtimeConfig,
        APP_ENV_LABEL: 'Production',
        MAX_UPLOAD_BYTES: 52_428_800,
      },
      viteEnvironment: {},
    });

    expect(first.appEnvLabel).toBe('Test');
    expect(second.appEnvLabel).toBe('Production');
    expect(second.maxUploadBytes).toBe(52_428_800);
  });

  it('keeps local Vite configuration behind the development adapter', () => {
    expect(
      resolveWebEnvironment({
        isProduction: false,
        runtimeConfig: null,
        viteEnvironment: {
          VITE_API_URL: 'http://localhost:3000/api/v1',
          VITE_GOOGLE_CLIENT_ID:
            'development-client.apps.googleusercontent.com',
          VITE_CSRF_COOKIE_NAME: 'homeapp_csrf',
        },
      }),
    ).toMatchObject({
      apiUrl: 'http://localhost:3000/api/v1',
      maxUploadBytes: 26_214_400,
      financeImportMaxFileBytes: 20_971_520,
    });
  });

  it('does not accept backend secrets as runtime config fields', () => {
    expect(() =>
      parseRuntimeConfig({
        ...runtimeConfig,
        DATABASE_URL: 'postgresql://secret',
        INTERNAL_HEALTH_TOKEN: 'not-public',
        POSTGRES_PASSWORD: 'not-public',
      }),
    ).toThrow('nepovolené pole');
  });

  it('rejects a cross-origin production API URL', () => {
    expect(() =>
      parseRuntimeConfig({
        ...runtimeConfig,
        API_URL: 'https://api.example.test/api/v1',
      }),
    ).toThrow('same-origin');
  });
});
