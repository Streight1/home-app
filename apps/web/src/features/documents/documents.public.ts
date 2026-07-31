import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDocument } from './api/documentsApi.js';
import { useDocuments } from './hooks/useDocuments.js';
import { DOCUMENTS_QUERY_KEY } from './hooks/useDocuments.js';
export { useDocumentNavigation } from './navigation/useDocumentNavigation.js';

export function useDocumentPickerOptions() {
  const query = useDocuments({ page: 1, pageSize: 100, status: 'ACTIVE' });
  return {
    ...query,
    data: query.data?.items.map((document) => ({
      id: document.id,
      type: document.type,
      primaryLabel: document.presentation.primaryLabel,
      canPreview: document.canPreview,
    })),
  };
}

export function useUploadDocumentImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) =>
      createDocument({
        title,
        documentType: 'GENERAL',
        metadata: {},
        file,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY }),
  });
}
