import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getDocuments, getTrashDocuments } from '../api/documentsApi.js';
import type { DocumentListQuery } from '../types/document.types.js';

export const DOCUMENTS_QUERY_KEY = ['documents'] as const;

export function useDocuments(
  query: DocumentListQuery,
  view: 'library' | 'trash' = 'library',
) {
  return useQuery({
    queryKey: [...DOCUMENTS_QUERY_KEY, view, query],
    queryFn: () =>
      view === 'trash' ? getTrashDocuments(query) : getDocuments(query),
    placeholderData: keepPreviousData,
  });
}
