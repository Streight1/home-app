import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  ApplicationSearchResponse,
  SearchEntityType,
} from '../types/search.types.js';

export function searchApplication(
  input: {
    query: string;
    types: readonly SearchEntityType[];
    limitPerType?: number;
  },
  signal: AbortSignal,
): Promise<ApplicationSearchResponse> {
  return apiRequest<ApplicationSearchResponse>('/search', {
    method: 'POST',
    body: JSON.stringify({
      query: input.query,
      ...(input.types.length ? { types: input.types } : {}),
      limitPerType: input.limitPerType ?? 5,
    }),
    signal,
    cache: 'no-store',
  });
}
