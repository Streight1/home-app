import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, mergeConfig, type UserConfig } from 'vite';
import { validateApplicationDevelopmentEnvironment } from './vite.development-environment.js';
import { createSharedViteConfig } from './vite.shared.config.js';

const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));

export function createApplicationDevelopmentConfig(mode: string): UserConfig {
  const environment = loadEnv(mode, workspaceRoot, '');
  const development = validateApplicationDevelopmentEnvironment(environment);

  return mergeConfig(createSharedViteConfig(), {
    envDir: workspaceRoot,
    define: {
      'import.meta.env.VITE_CSRF_COOKIE_NAME': JSON.stringify(
        development.csrfCookieName,
      ),
    },
    server: {
      port: development.port,
      strictPort: true,
    },
  });
}

export default defineConfig(({ mode }) =>
  createApplicationDevelopmentConfig(mode),
);
