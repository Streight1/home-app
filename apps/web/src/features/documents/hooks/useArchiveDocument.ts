import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveDocument } from '../api/documentsApi.js';
import { DOCUMENTS_QUERY_KEY } from './useDocuments.js';

export function useArchiveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveDocument,
    onSuccess: async (document) => {
      queryClient.setQueryData(
        [...DOCUMENTS_QUERY_KEY, 'detail', document.id],
        document,
      );
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}
