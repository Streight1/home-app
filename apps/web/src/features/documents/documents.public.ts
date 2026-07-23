import { useDocuments } from './hooks/useDocuments.js';
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
