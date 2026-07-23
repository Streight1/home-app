import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type UserConfig } from 'vite';

const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));

function readPort(value: string | undefined): number {
  if (value === undefined) throw new Error('WEB_PORT není nastavený.');
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535)
    throw new Error('WEB_PORT musí být celé číslo od 1 do 65535.');
  return port;
}

function readRequired(
  environment: Record<string, string>,
  key: string,
): string {
  const value = environment[key]?.trim();
  if (!value) throw new Error(`${key} není nastavený.`);
  return value;
}

function isValidApiUrl(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) {
    return !value.includes('?') && !value.includes('#');
  }
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function createViteConfig(mode: string): UserConfig {
  const environment = loadEnv(mode, workspaceRoot, '');
  const apiUrl = readRequired(environment, 'VITE_API_URL');
  const googleClientId = readRequired(environment, 'VITE_GOOGLE_CLIENT_ID');
  const csrfCookieName = readRequired(environment, 'CSRF_COOKIE_NAME');
  if (!isValidApiUrl(apiUrl))
    throw new Error(
      'VITE_API_URL musí být same-origin cesta nebo HTTP(S) adresa.',
    );
  if (!/^[A-Za-z0-9_-]+$/.test(csrfCookieName))
    throw new Error('CSRF_COOKIE_NAME obsahuje nepovolené znaky.');

  return {
    envDir: workspaceRoot,
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_CSRF_COOKIE_NAME': JSON.stringify(csrfCookieName),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
    },
    server: { port: readPort(environment.WEB_PORT), strictPort: true },
    preview: { port: 4173, strictPort: true },
  };
}

export default defineConfig(({ mode }) => createViteConfig(mode));
