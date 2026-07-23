import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDocumentNavigation } from '../navigation/useDocumentNavigation.js';
import { createDocument } from '../api/documentsApi.js';
import { DOCUMENTS_QUERY_KEY } from './useDocuments.js';

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const navigation = useDocumentNavigation();
  return useMutation({
    mutationFn: createDocument,
    onSuccess: async (document) => {
      await queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
      navigation.openDocument(document.id);
    },
  });
}
