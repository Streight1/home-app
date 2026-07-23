import { useMutation } from '@tanstack/react-query';
import { downloadDocumentFile } from '../api/documentFilesApi.js';

export function useDownloadDocumentFile() {
  return useMutation({
    mutationFn: ({
      documentId,
      file,
    }: {
      documentId: string;
      file: { originalFilename: string };
    }) => downloadDocumentFile(documentId, file),
  });
}
