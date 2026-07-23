import type {
  ConfidenceReason,
  ExtractedValue,
  LayoutTextLine,
} from './extraction.types.js';

export interface SupplierProfileMatch {
  key: string;
  version: string;
  supplierName: string;
  confidence: number;
}

export interface InvoiceCandidateDraft {
  fieldKey: string;
  rawValue: string;
  normalizedValue: ExtractedValue;
  line: LayoutTextLine;
  exactLabel: boolean;
  validFormat: boolean;
  profileMatch: boolean;
  conflictingValues: boolean;
  confidenceReasons: ConfidenceReason[];
}
