import { apiRequest } from '../../../lib/api/apiClient.js';
import type { DocumentFolderNode } from '../types/document.types.js';

export function getDocumentFolders(): Promise<{ items: DocumentFolderNode[] }> {
  return apiRequest('/document-folders');
}
export function createDocumentFolder(
  name: string,
  parentId: string | null,
): Promise<DocumentFolderNode> {
  return apiRequest('/document-folders', {
    method: 'POST',
    body: JSON.stringify({ name, parentId }),
  });
}
export function renameDocumentFolder(
  folderId: string,
  name: string,
): Promise<DocumentFolderNode> {
  return apiRequest(`/document-folders/${folderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}
export function moveDocumentFolder(
  folderId: string,
  parentId: string | null,
): Promise<DocumentFolderNode> {
  return apiRequest(`/document-folders/${folderId}/move`, {
    method: 'POST',
    body: JSON.stringify({ parentId }),
  });
}
export function deleteDocumentFolder(folderId: string): Promise<void> {
  return apiRequest(`/document-folders/${folderId}`, { method: 'DELETE' });
}
