import { apiRequest } from '../../../lib/api/apiClient.js';
import type { ExtractionJob } from '../types/extraction.types.js';

export function startDocumentExtraction(
  documentId: string,
): Promise<ExtractionJob> {
  return apiRequest(`/documents/${documentId}/extractions`, { method: 'POST' });
}
export function retryDocumentExtraction(
  documentId: string,
  jobId: string,
): Promise<ExtractionJob> {
  return apiRequest(`/documents/${documentId}/extractions/${jobId}/retry`, {
    method: 'POST',
  });
}
export function getDocumentExtraction(
  documentId: string,
  jobId: string,
): Promise<ExtractionJob> {
  return apiRequest(`/documents/${documentId}/extractions/${jobId}`);
}
export function reviewExtractionField(
  documentId: string,
  jobId: string,
  candidateId: string,
  status: 'ACCEPTED' | 'EDITED' | 'REJECTED',
  value?: string | number | boolean,
): Promise<ExtractionJob> {
  return apiRequest(
    `/documents/${documentId}/extractions/${jobId}/fields/${candidateId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(value !== undefined ? { value } : {}),
      }),
    },
  );
}
export function acceptSafeExtractionFields(
  documentId: string,
  jobId: string,
): Promise<ExtractionJob> {
  return apiRequest(
    `/documents/${documentId}/extractions/${jobId}/accept-safe`,
    { method: 'POST' },
  );
}
