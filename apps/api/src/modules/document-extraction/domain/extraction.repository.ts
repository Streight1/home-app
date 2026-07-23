import type { DocumentTypeKey } from '../../documents/domain/metadata/document-type.js';
import type {
  ExtractionFieldStatus,
  ExtractionJobStatus,
  ExtractedFieldCandidate,
  ExtractedValue,
  ConfidenceReason,
  SourceRegion,
} from './extraction.types.js';

export const EXTRACTION_REPOSITORY = Symbol('EXTRACTION_REPOSITORY');

export interface ExtractionCandidateRecord {
  id: string;
  fieldKey: string;
  rawValue: string;
  normalizedValue: ExtractedValue;
  confidence: number;
  confidenceReasons: readonly ConfidenceReason[];
  sourcePage: number | null;
  sourceText: string | null;
  sourceRegion: SourceRegion | null;
  status: ExtractionFieldStatus;
  reviewedAt: Date | null;
}
export interface ExtractionJobRecord {
  id: string;
  householdId: string;
  documentId: string;
  documentFileId: string;
  documentType: DocumentTypeKey;
  status: ExtractionJobStatus;
  extractorKey: string;
  extractorVersion: string;
  schemaVersion: number;
  errorCode: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  rawText: string | null;
  candidates: ExtractionCandidateRecord[];
}
export interface ExtractionRepository {
  createJob(input: {
    id: string;
    householdId: string;
    documentId: string;
    documentFileId: string;
    documentType: DocumentTypeKey;
    extractorKey: string;
    extractorVersion: string;
    schemaVersion: number;
    userId: string;
  }): Promise<ExtractionJobRecord>;
  findJob(
    householdId: string,
    documentId: string,
    jobId: string,
  ): Promise<ExtractionJobRecord | null>;
  markProcessing(jobId: string): Promise<void>;
  complete(
    jobId: string,
    rawText: string,
    candidates: readonly ExtractedFieldCandidate[],
  ): Promise<void>;
  fail(jobId: string, errorCode: string): Promise<void>;
  reviewCandidate(input: {
    jobId: string;
    candidateId: string;
    userId: string;
    status: Exclude<ExtractionFieldStatus, 'PROPOSED'>;
    normalizedValue: ExtractedValue;
  }): Promise<void>;
}
