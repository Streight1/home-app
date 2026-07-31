import { isIP } from 'node:net';
import { expeditionsInvalid } from '../domain/expeditions.errors.js';

function blockedV4(address: string): boolean {
  const values = address.split('.').map(Number);
  const [a = -1, b = -1] = values;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export function isBlockedNetworkAddress(address: string): boolean {
  const normalized = address.toLowerCase().split('%')[0] ?? address;
  if (normalized.startsWith('::ffff:'))
    return blockedV4(normalized.slice('::ffff:'.length));
  if (isIP(normalized) === 4) return blockedV4(normalized);
  if (isIP(normalized) !== 6) return true;
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith('2001:db8:')
  );
}

export function validatePublicImageUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw expeditionsInvalid('Adresa obrázku není platná.');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port !== ''
  )
    throw expeditionsInvalid(
      'Obrázek musí používat přímou HTTPS adresu bez přihlašovacích údajů.',
    );
  const normalizedHostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const hostname =
    normalizedHostname.startsWith('[') && normalizedHostname.endsWith(']')
      ? normalizedHostname.slice(1, -1)
      : normalizedHostname;
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    (isIP(hostname) !== 0 && isBlockedNetworkAddress(hostname))
  )
    throw expeditionsInvalid('Interní síťovou adresu nelze použít.');
  return url;
}
