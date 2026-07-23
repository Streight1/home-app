import { useQuery } from '@tanstack/react-query';
import { getDocument } from '../api/documentsApi.js';
import { DOCUMENTS_QUERY_KEY } from './useDocuments.js';

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: [...DOCUMENTS_QUERY_KEY, 'detail', documentId],
    queryFn: () => getDocument(documentId),
    enabled: documentId.length > 0,
  });
}
