import { ApiError } from '../../../lib/api/apiError.js';

export function taskErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Operaci se nepodařilo dokončit. Zkuste to znovu.';
}
