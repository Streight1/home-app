import { apiRequest } from '../../../lib/api/apiClient.js';
import type { DocumentTypeDefinition } from '../types/document.types.js';
export function getDocumentTypes(): Promise<{
  items: DocumentTypeDefinition[];
}> {
  return apiRequest('/document-types');
}
