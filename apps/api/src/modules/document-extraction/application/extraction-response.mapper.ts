import type { ExtractionJobRecord } from '../domain/extraction.repository.js';

export function mapExtractionJob(job: ExtractionJobRecord) {
  return {
    id: job.id,
    documentId: job.documentId,
    status: job.status,
    extractionType: 'STRUCTURED_DATA' as const,
    extractor: { key: job.extractorKey, version: job.extractorVersion },
    schemaVersion: job.schemaVersion,
    errorCode: job.errorCode,
    startedAt: job.startedAt?.toISOString() ?? null,
    finishedAt: job.finishedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    candidates: job.candidates.map((candidate) => ({
      id: candidate.id,
      fieldKey: candidate.fieldKey,
      rawValue: candidate.rawValue,
      normalizedValue: candidate.normalizedValue,
      confidence: candidate.confidence,
      confidenceReasons: candidate.confidenceReasons,
      sourcePage: candidate.sourcePage,
      sourceText: candidate.sourceText,
      sourceRegion: candidate.sourceRegion,
      status: candidate.status,
      reviewedAt: candidate.reviewedAt?.toISOString() ?? null,
    })),
  };
}
