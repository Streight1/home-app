export interface ApplicationDevelopmentEnvironment {
  apiUrl: string;
  csrfCookieName: string;
  port: number;
}

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

export function validateApplicationDevelopmentEnvironment(
  environment: Record<string, string>,
): ApplicationDevelopmentEnvironment {
  const apiUrl = readRequired(environment, 'VITE_API_URL');
  readRequired(environment, 'VITE_GOOGLE_CLIENT_ID');
  const csrfCookieName = readRequired(environment, 'CSRF_COOKIE_NAME');

  if (!isValidApiUrl(apiUrl))
    throw new Error(
      'VITE_API_URL musí být same-origin cesta nebo HTTP(S) adresa.',
    );
  if (!/^[A-Za-z0-9_-]+$/.test(csrfCookieName))
    throw new Error('CSRF_COOKIE_NAME obsahuje nepovolené znaky.');

  return {
    apiUrl,
    csrfCookieName,
    port: readPort(environment.WEB_PORT),
  };
}
