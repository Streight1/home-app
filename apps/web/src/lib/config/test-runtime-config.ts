import type { HomeAppPublicRuntimeConfig } from './runtime-config.types.js';

export const TEST_PUBLIC_RUNTIME_CONFIG: Readonly<HomeAppPublicRuntimeConfig> =
  Object.freeze({
    API_URL: '/api/v1',
    GOOGLE_CLIENT_ID: '000000000000-ci.apps.googleusercontent.com',
    APP_ENV_LABEL: 'Test',
    MAX_UPLOAD_BYTES: 26_214_400,
    FINANCE_IMPORT_MAX_FILE_BYTES: 20_971_520,
    CSRF_COOKIE_NAME: 'homeapp_csrf',
  });

interface TestRuntimeWindow {
  __HOMEAPP_CONFIG__?: HomeAppPublicRuntimeConfig;
}

function getTestWindow(): TestRuntimeWindow {
  return window as unknown as TestRuntimeWindow;
}

export function installTestPublicRuntimeConfig(
  overrides: Partial<HomeAppPublicRuntimeConfig> = {},
): void {
  getTestWindow().__HOMEAPP_CONFIG__ = {
    ...TEST_PUBLIC_RUNTIME_CONFIG,
    ...overrides,
  };
}

export function resetTestPublicRuntimeConfig(): void {
  delete getTestWindow().__HOMEAPP_CONFIG__;
}
