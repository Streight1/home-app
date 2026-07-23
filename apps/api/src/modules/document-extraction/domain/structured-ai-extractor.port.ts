import type {
  ExtractedFieldCandidate,
  ExtractedPage,
} from './extraction.types.js';

export const STRUCTURED_AI_EXTRACTOR_PORT = Symbol(
  'STRUCTURED_AI_EXTRACTOR_PORT',
);
export interface StructuredAiExtractorPort {
  readonly configured: boolean;
  extract(
    pages: readonly ExtractedPage[],
    signal: AbortSignal,
  ): Promise<readonly ExtractedFieldCandidate[]>;
}
