import { apiBlobRequest } from '../../../lib/api/apiClient.js';
export function previewDocumentFile(
  documentId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return apiBlobRequest(`/documents/${documentId}/file/preview`, {
    ...(signal ? { signal } : {}),
  });
}
export async function downloadDocumentFile(
  documentId: string,
  file: { originalFilename: string },
): Promise<void> {
  const blob = await apiBlobRequest(`/documents/${documentId}/file/download`);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = file.originalFilename;
  document.body.append(anchor);
  try {
    anchor.click();
    await Promise.resolve();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
