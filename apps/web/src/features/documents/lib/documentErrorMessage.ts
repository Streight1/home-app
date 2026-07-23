import { ApiError } from '../../../lib/api/apiError.js';

const messages = new Map<string, string>([
  ['DOCUMENT_INVALID_FILE', 'Tento soubor nelze nahrát. Zkontrolujte typ.'],
  ['DOCUMENT_FILE_REQUIRED', 'Vyberte soubor, který chcete nahrát.'],
  ['DOCUMENT_FILE_TOO_LARGE', 'Soubor překračuje povolenou velikost.'],
  ['HOUSEHOLD_ACCESS_DENIED', 'Pro tuto akci nemáte dostatečné oprávnění.'],
  ['NETWORK_UNAVAILABLE', 'Server není dostupný. Zkontrolujte připojení.'],
  ['REQUEST_TIMEOUT', 'Server neodpověděl včas. Zkuste to znovu.'],
]);

export function documentErrorMessage(error: unknown): string {
  if (error instanceof ApiError)
    return messages.get(error.code) ?? error.message;
  return 'Akci se nepodařilo dokončit. Zkuste to znovu.';
}
