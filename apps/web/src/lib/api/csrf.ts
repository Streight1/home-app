import { webEnvironment } from '../config/environment.js';

export function readCookie(name: string): string | undefined {
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : undefined;
}

export function addCsrfHeader(headers: Headers): void {
  const csrfToken = readCookie(webEnvironment.csrfCookieName);
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
}
