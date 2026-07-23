import { useQuery } from '@tanstack/react-query';
import { getDocumentTypes } from '../api/documentTypesApi.js';
export const DOCUMENT_TYPES_QUERY_KEY = ['document-types'] as const;
export function useDocumentTypes() {
  return useQuery({
    queryKey: DOCUMENT_TYPES_QUERY_KEY,
    queryFn: getDocumentTypes,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
