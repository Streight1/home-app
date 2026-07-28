import { describe, expect, it } from 'vitest';
import storybookConfig from './.storybook/main.js';
import playwrightConfig from './playwright.config.js';
import { validateApplicationDevelopmentEnvironment } from './vite.development-environment.js';
import { createSharedViteConfig } from './vite.shared.config.js';

describe('Vite configuration boundaries', () => {
  it('creates an environment-independent shared config', () => {
    const config = createSharedViteConfig();

    expect(config.envDir).toBe(false);
    expect(config.server).toBeUndefined();
    expect(config.define).toBeUndefined();
    expect(config.plugins).toHaveLength(2);
  });

  it('keeps Storybook on the shared config without the app dev server', async () => {
    expect(storybookConfig.viteFinal).toBeTypeOf('function');

    const resolved = await storybookConfig.viteFinal?.({}, {
      configType: 'DEVELOPMENT',
    } as never);

    expect(resolved?.envDir).toBe(false);
    expect(resolved?.server?.proxy).toBeUndefined();
    expect(resolved?.define).toBeUndefined();
  });

  it('does not reuse an unknown Storybook server by default', () => {
    const webServer = Array.isArray(playwrightConfig.webServer)
      ? playwrightConfig.webServer[0]
      : playwrightConfig.webServer;

    expect(webServer?.url).toBe('http://127.0.0.1:6006/index.json');
    expect(webServer?.reuseExistingServer).toBe(false);
  });

  it('still requires the local app development contract explicitly', () => {
    expect(() =>
      validateApplicationDevelopmentEnvironment({
        VITE_API_URL: 'http://localhost:3000/api/v1',
        VITE_GOOGLE_CLIENT_ID: 'development-client.apps.googleusercontent.com',
        WEB_PORT: '5173',
      }),
    ).toThrow('CSRF_COOKIE_NAME');

    expect(
      validateApplicationDevelopmentEnvironment({
        VITE_API_URL: 'http://localhost:3000/api/v1',
        VITE_GOOGLE_CLIENT_ID: 'development-client.apps.googleusercontent.com',
        CSRF_COOKIE_NAME: 'homeapp_csrf',
        WEB_PORT: '5173',
      }),
    ).toEqual({
      apiUrl: 'http://localhost:3000/api/v1',
      csrfCookieName: 'homeapp_csrf',
      port: 5173,
    });
  });
});
