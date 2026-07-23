import { Injectable } from '@nestjs/common';
import {
  extractionNotConfigured,
  extractionNotSupported,
} from '../domain/extraction.errors.js';
import type { DocumentExtractorPort } from '../domain/document-extractor.port.js';
import type {
  ExtractionInput,
  ExtractionOutput,
} from '../domain/extraction.types.js';

@Injectable()
export class NotConfiguredImageOcrAdapter implements DocumentExtractorPort {
  public readonly key = 'image-ocr-not-configured';
  public readonly version = '1.0.0';
  public supports(mimeType: string): boolean {
    return mimeType === 'image/jpeg' || mimeType === 'image/png';
  }
  public extract(input: ExtractionInput): Promise<ExtractionOutput> {
    if (!this.supports(input.mimeType)) throw extractionNotSupported();
    throw extractionNotConfigured();
  }
}
