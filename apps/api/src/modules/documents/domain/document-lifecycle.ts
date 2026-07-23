import type { DocumentTypeKey } from './metadata/document-type.js';

export function resolveTrashRestoreFolderId(
  originalFolderId: string | null,
  originalFolderExists: boolean,
): string | null {
  return originalFolderId && originalFolderExists ? originalFolderId : null;
}

export function permanentDeleteTombstone(
  documentId: string,
  type: DocumentTypeKey,
): Readonly<{ documentId: string; type: DocumentTypeKey }> {
  return { documentId, type };
}
