import { resolveWebEnvironment } from './runtime-config.js';
import type { WebEnvironment } from './runtime-config.types.js';

let cachedEnvironment: WebEnvironment | undefined;

export function getWebEnvironment(): WebEnvironment {
  if (import.meta.env.PROD && cachedEnvironment) return cachedEnvironment;
  const resolved = resolveWebEnvironment({
    isProduction: import.meta.env.PROD,
    runtimeConfig: window.__HOMEAPP_CONFIG__,
    viteEnvironment: import.meta.env,
  });
  if (import.meta.env.PROD) cachedEnvironment = resolved;
  return resolved;
}

export function validateWebEnvironment(): Error | null {
  try {
    getWebEnvironment();
    return null;
  } catch (error) {
    return error instanceof Error ? error : new Error('Neplatná konfigurace.');
  }
}

export const webEnvironment = {
  get apiUrl(): string {
    return getWebEnvironment().apiUrl;
  },
  get googleClientId(): string {
    return getWebEnvironment().googleClientId;
  },
  get csrfCookieName(): string {
    return getWebEnvironment().csrfCookieName;
  },
  get maxUploadBytes(): number {
    return getWebEnvironment().maxUploadBytes;
  },
  get financeImportMaxFileBytes(): number {
    return getWebEnvironment().financeImportMaxFileBytes;
  },
  get appEnvLabel(): string | null {
    return getWebEnvironment().appEnvLabel;
  },
};
