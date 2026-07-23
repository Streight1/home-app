import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreDocument } from '../api/documentsApi.js';
import { DOCUMENTS_QUERY_KEY } from './useDocuments.js';

export function useRestoreDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreDocument,
    onSuccess: async (document) => {
      queryClient.setQueryData(
        [...DOCUMENTS_QUERY_KEY, 'detail', document.id],
        document,
      );
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}
