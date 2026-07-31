import { webEnvironment } from '../config/environment.js';
import { ApiError } from './apiError.js';
import { addCsrfHeader } from './csrf.js';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface ApiErrorPayload {
  code?: string;
  message?: string;
}

const requestTimeoutMilliseconds = 30_000;

function requestSignal(signal: AbortSignal | null | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(requestTimeoutMilliseconds);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function performRequest(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  const isMultipart =
    typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body !== undefined && !headers.has('Content-Type') && !isMultipart)
    headers.set('Content-Type', 'application/json');
  if (unsafeMethods.has(method)) addCsrfHeader(headers);

  try {
    const response = await fetch(`${webEnvironment.apiUrl}${path}`, {
      ...init,
      method,
      headers,
      credentials: 'include',
      signal: requestSignal(init.signal),
    });
    if (!response.ok) throw await createApiError(response);
    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error;
    if (error instanceof DOMException && error.name === 'TimeoutError')
      throw new ApiError(
        0,
        'REQUEST_TIMEOUT',
        'Server neodpověděl včas. Zkuste to znovu.',
      );
    throw new ApiError(
      0,
      'NETWORK_UNAVAILABLE',
      'Server není dostupný. Zkontrolujte připojení.',
    );
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await performRequest(path, init);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function apiBlobRequest(
  path: string,
  init: RequestInit = {},
): Promise<Blob> {
  return (await performRequest(path, init)).blob();
}

async function createApiError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload = {};
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    // Non-JSON responses are intentionally hidden behind a safe message.
  }
  return new ApiError(
    response.status,
    payload.code ?? 'REQUEST_FAILED',
    payload.message ?? 'Požadavek se nepodařilo dokončit.',
  );
}
