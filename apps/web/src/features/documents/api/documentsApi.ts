import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  CreateDocumentInput,
  DocumentItem,
  DocumentListQuery,
  DocumentListResponse,
  UpdateDocumentInput,
} from '../types/document.types.js';

export function getDocuments(
  query: DocumentListQuery,
): Promise<DocumentListResponse> {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '' && value !== false)
      parameters.set(key, String(value));
  }
  const suffix = parameters.size > 0 ? `?${parameters.toString()}` : '';
  return apiRequest<DocumentListResponse>(`/documents${suffix}`);
}
export function getDocument(documentId: string): Promise<DocumentItem> {
  return apiRequest<DocumentItem>(`/documents/${documentId}`);
}
export function createDocument(
  input: CreateDocumentInput,
): Promise<DocumentItem> {
  const body = new FormData();
  body.set('title', input.title);
  if (input.description) body.set('description', input.description);
  if (input.notes) body.set('notes', input.notes);
  body.set('documentType', input.documentType);
  if (input.folderId) body.set('folderId', input.folderId);
  if (input.documentDate) body.set('documentDate', input.documentDate);
  body.set('metadata', JSON.stringify(input.metadata));
  body.set('file', input.file);
  return apiRequest<DocumentItem>('/documents', { method: 'POST', body });
}
export function updateDocument(
  documentId: string,
  input: UpdateDocumentInput,
): Promise<DocumentItem> {
  return apiRequest<DocumentItem>(`/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
export function moveDocument(
  documentId: string,
  folderId: string | null,
): Promise<DocumentItem> {
  return apiRequest<DocumentItem>(`/documents/${documentId}/move`, {
    method: 'POST',
    body: JSON.stringify({ folderId }),
  });
}
export function archiveDocument(documentId: string): Promise<DocumentItem> {
  return apiRequest<DocumentItem>(`/documents/${documentId}/archive`, {
    method: 'POST',
  });
}
export function restoreDocument(documentId: string): Promise<DocumentItem> {
  return apiRequest<DocumentItem>(`/documents/${documentId}/restore`, {
    method: 'POST',
  });
}
export function trashDocument(documentId: string): Promise<DocumentItem> {
  return apiRequest<DocumentItem>(`/documents/${documentId}/trash`, {
    method: 'POST',
  });
}
export function restoreDocumentFromTrash(
  documentId: string,
): Promise<DocumentItem> {
  return apiRequest<DocumentItem>(
    `/documents/${documentId}/restore-from-trash`,
    {
      method: 'POST',
    },
  );
}
export function permanentlyDeleteDocument(
  documentId: string,
): Promise<undefined> {
  return apiRequest<undefined>(`/documents/${documentId}/permanent`, {
    method: 'DELETE',
  });
}
export function getTrashDocuments(
  query: DocumentListQuery,
): Promise<DocumentListResponse> {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (
      key !== 'status' &&
      value !== undefined &&
      value !== '' &&
      value !== false
    )
      parameters.set(key, String(value));
  const suffix = parameters.size > 0 ? `?${parameters.toString()}` : '';
  return apiRequest<DocumentListResponse>(`/documents/trash${suffix}`);
}
