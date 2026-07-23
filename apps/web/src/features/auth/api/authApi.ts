import { apiRequest } from '../../../lib/api/apiClient.js';
import type { AuthProfile } from '../types/auth.types.js';

export function getCurrentUser(): Promise<AuthProfile> {
  return apiRequest<AuthProfile>('/auth/me');
}

export function loginWithGoogle(credential: string): Promise<AuthProfile> {
  return apiRequest<AuthProfile>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export async function logout(): Promise<void> {
  await apiRequest<unknown>('/auth/logout', { method: 'POST' });
}
