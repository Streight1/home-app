export type ExtractionJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'REVIEW_REQUIRED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';
export type ExtractionFieldStatus =
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'EDITED'
  | 'REJECTED';
export interface ExtractionCandidate {
  id: string;
  fieldKey: string;
  rawValue: string;
  normalizedValue: MetadataValue;
  confidence: number;
  confidenceReasons: readonly string[];
  sourcePage: number | null;
  sourceText: string | null;
  sourceRegion: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  status: ExtractionFieldStatus;
  reviewedAt: string | null;
}
export interface ExtractionJob {
  id: string;
  documentId: string;
  status: ExtractionJobStatus;
  extractionType: 'STRUCTURED_DATA';
  extractor: { key: string; version: string };
  schemaVersion: number;
  errorCode: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  candidates: ExtractionCandidate[];
}
import type { MetadataValue } from './document.types.js';
