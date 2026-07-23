import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  acceptSafeExtractionFields,
  getDocumentExtraction,
  reviewExtractionField,
  startDocumentExtraction,
} from '../api/documentExtractionApi.js';
import { DOCUMENTS_QUERY_KEY } from './useDocuments.js';

const finalStatuses = new Set([
  'REVIEW_REQUIRED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);
export function extractionQueryKey(documentId: string, jobId: string) {
  return ['document-extraction', documentId, jobId] as const;
}
export function useExtractionJob(documentId: string, jobId: string | null) {
  const polls = useRef(0);
  useEffect(() => {
    polls.current = 0;
  }, [jobId]);
  return useQuery({
    queryKey: extractionQueryKey(documentId, jobId ?? ''),
    queryFn: () => getDocumentExtraction(documentId, jobId ?? ''),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const job = query.state.data;
      if (!job || finalStatuses.has(job.status) || polls.current >= 60)
        return false;
      polls.current += 1;
      return 2_000;
    },
  });
}
export function useStartExtraction(documentId: string) {
  return useMutation({ mutationFn: () => startDocumentExtraction(documentId) });
}
export function useReviewExtractionField(documentId: string, jobId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      candidateId: string;
      status: 'ACCEPTED' | 'EDITED' | 'REJECTED';
      value?: string | number | boolean;
    }) =>
      reviewExtractionField(
        documentId,
        jobId,
        input.candidateId,
        input.status,
        input.value,
      ),
    onSuccess: async (job) => {
      client.setQueryData(extractionQueryKey(documentId, jobId), job);
      await client.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}
export function useAcceptSafeExtractionFields(
  documentId: string,
  jobId: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => acceptSafeExtractionFields(documentId, jobId),
    onSuccess: async (job) => {
      client.setQueryData(extractionQueryKey(documentId, jobId), job);
      await client.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEY });
    },
  });
}
