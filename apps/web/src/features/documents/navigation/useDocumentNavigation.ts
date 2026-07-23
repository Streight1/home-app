import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';

export function useDocumentNavigation() {
  const workspace = useWorkspaceNavigation();
  return {
    openDocuments: () =>
      workspace.navigate({ area: 'documents', screen: 'list' }),
    openDocumentCreate: () =>
      workspace.navigate({ area: 'documents', screen: 'new' }),
    openDocumentTrash: () =>
      workspace.navigate({ area: 'documents', screen: 'trash' }),
    openDocument: (documentId: string) =>
      workspace.navigate({ area: 'documents', screen: 'detail', documentId }),
    openDocumentPreview: (documentId: string) =>
      workspace.openOverlay({ kind: 'document-preview', documentId }),
    openDocumentExtraction: (documentId: string) =>
      workspace.navigate({
        area: 'documents',
        screen: 'extraction',
        documentId,
      }),
  };
}
