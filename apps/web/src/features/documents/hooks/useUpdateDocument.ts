import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocument } from '../api/documentsApi.js';
import type { UpdateDocumentInput } from '../types/document.types.js';
import { DOCUMENTS_QUERY_KEY } from './useDocuments.js';

export function useUpdateDocument(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDocumentInput) =>
      updateDocument(documentId, input),
    onSuccess: async (document) => {
      queryClient.setQueryData(
        [...DOCUMENTS_QUERY_KEY, 'detail', documentId],
        document,
      );
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}
