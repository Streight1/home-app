import { useEffect, useState } from 'react';
import { ApiError } from '../../../lib/api/apiError.js';
import { searchApplication } from '../api/searchApi.js';
import type {
  ApplicationSearchResponse,
  SearchEntityType,
} from '../types/search.types.js';

const SEARCH_DEBOUNCE_MS = 250;

export function useApplicationSearch(
  query: string,
  types: readonly SearchEntityType[],
  enabled: boolean,
) {
  const [data, setData] = useState<ApplicationSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typeKey = types.join(',');

  useEffect(() => {
    const normalized = query.replace(/\s+/g, ' ').trim();
    if (!enabled || normalized.length < 2) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      void searchApplication(
        { query: normalized, types, limitPerType: types.length ? 10 : 5 },
        controller.signal,
      )
        .then((response) => setData(response))
        .catch((reason: unknown) => {
          if (reason instanceof DOMException && reason.name === 'AbortError')
            return;
          setData(null);
          setError(
            reason instanceof ApiError
              ? reason.message
              : 'Hledání se nepodařilo dokončit.',
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, query, typeKey, types]);

  return { data, isLoading, error };
}
