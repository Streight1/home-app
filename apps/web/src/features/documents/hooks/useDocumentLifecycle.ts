import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  permanentlyDeleteDocument,
  restoreDocumentFromTrash,
  trashDocument,
} from '../api/documentsApi.js';
import { DOCUMENTS_QUERY_KEY } from './useDocuments.js';

function useLifecycleMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}
export function useTrashDocument() {
  return useLifecycleMutation(trashDocument);
}
export function useRestoreDocumentFromTrash() {
  return useLifecycleMutation(restoreDocumentFromTrash);
}
export function usePermanentlyDeleteDocument() {
  return useLifecycleMutation(permanentlyDeleteDocument);
}
