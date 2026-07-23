import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moveDocument } from '../api/documentsApi.js';
import { DOCUMENTS_QUERY_KEY } from './useDocuments.js';
export function useMoveDocument(documentId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (folderId: string | null) => moveDocument(documentId, folderId),
    onSuccess: async (document) => {
      client.setQueryData(
        [...DOCUMENTS_QUERY_KEY, 'detail', documentId],
        document,
      );
      await client.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}
