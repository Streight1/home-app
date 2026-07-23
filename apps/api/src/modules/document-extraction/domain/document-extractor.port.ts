import type { ExtractionInput, ExtractionOutput } from './extraction.types.js';

export interface DocumentExtractorPort {
  readonly key: string;
  readonly version: string;
  supports(mimeType: string): boolean;
  extract(
    input: ExtractionInput,
    signal: AbortSignal,
  ): Promise<ExtractionOutput>;
}
