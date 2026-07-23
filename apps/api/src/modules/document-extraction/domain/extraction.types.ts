import type { DocumentTypeKey } from '../../documents/domain/metadata/document-type.js';

export const extractionJobStatuses = [
  'QUEUED',
  'PROCESSING',
  'REVIEW_REQUIRED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;
export type ExtractionJobStatus = (typeof extractionJobStatuses)[number];
export const extractionFieldStatuses = [
  'PROPOSED',
  'ACCEPTED',
  'EDITED',
  'REJECTED',
] as const;
export type ExtractionFieldStatus = (typeof extractionFieldStatuses)[number];

export type ConfidenceReason =
  | 'EXACT_LABEL_MATCH'
  | 'NEAR_LABEL_MATCH'
  | 'SUPPLIER_PROFILE_MATCH'
  | 'VALID_FORMAT'
  | 'VALID_CHECKSUM'
  | 'CROSS_FIELD_CONSISTENT'
  | 'MULTIPLE_CONFLICTING_VALUES'
  | 'OCR_LOW_CONFIDENCE'
  | 'TOTALS_INCONSISTENT'
  | 'DATE_SEQUENCE_INCONSISTENT';
export interface SourceRegion {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface LayoutTextBlock extends SourceRegion {
  text: string;
  order: number;
  confidence: number | null;
}
export interface LayoutTextLine extends SourceRegion {
  text: string;
  blocks: readonly LayoutTextBlock[];
}
export interface LayoutRegion extends SourceRegion {
  kind: 'HEADER' | 'BODY' | 'FOOTER';
  text: string;
}
export interface LayoutTableCandidate {
  page: number;
  rows: readonly LayoutTextLine[];
  columnCount: number;
}
export interface ExtractedPage {
  page: number;
  text: string;
  blocks: readonly LayoutTextBlock[];
  lines: readonly LayoutTextLine[];
  regions: readonly LayoutRegion[];
  tables: readonly LayoutTableCandidate[];
}
export interface ExtractedLineItem {
  description: string;
  quantity?: string;
  unit?: string;
  unitPriceMinor?: number;
  vatRate?: string;
  totalAmountMinor?: number;
}
export type ExtractedValue = string | number | boolean | ExtractedLineItem[];
export interface ExtractedFieldCandidate {
  fieldKey: string;
  rawValue: string;
  normalizedValue: ExtractedValue;
  confidence: number;
  confidenceReasons: readonly ConfidenceReason[];
  sourcePage: number | null;
  sourceText: string | null;
  sourceRegion: SourceRegion | null;
}
export interface ExtractionInput {
  mimeType: string;
  buffer: Uint8Array;
  documentType: DocumentTypeKey;
}
export interface ExtractionOutput {
  rawText: string;
  pages: readonly ExtractedPage[];
  candidates: readonly ExtractedFieldCandidate[];
}
