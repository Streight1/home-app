import { readFile } from 'node:fs/promises';
import { parse } from 'dotenv';
import { expand } from 'dotenv-expand';
import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../src/config/app-config.schema.js';

describe('central workspace environment', () => {
  it('expands dependent values from the root example', async () => {
    const source = await readFile(
      new URL('../../../.env.example', import.meta.url),
      'utf8',
    );
    const processEnvironment: Record<string, string> = {};
    const parsed = parse(source);

    expand({ parsed, processEnv: processEnvironment });

    expect(processEnvironment).toMatchObject({
      WEB_ORIGIN: 'http://localhost:5173',
      VITE_API_URL: 'http://localhost:3000/api/v1',
      VITE_GOOGLE_CLIENT_ID:
        'replace-with-client-id.apps.googleusercontent.com',
      DATABASE_URL:
        'postgresql://homeapp:homeapp_local_password@127.0.0.1:5432/homeapp?schema=public',
    });
    expect(validateEnvironment(processEnvironment)).toMatchObject({
      API_PORT: 3000,
      CSRF_COOKIE_NAME: 'homeapp_csrf',
      SESSION_COOKIE_NAME: 'homeapp_session',
    });
  });
});
