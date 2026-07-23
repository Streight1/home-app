import { Injectable } from '@nestjs/common';
import { NotConfiguredImageOcrAdapter } from '../adapters/not-configured-image-ocr.adapter.js';
import { PdfTextLayerExtractorService } from '../adapters/pdf-text-layer-extractor.service.js';
import { extractionNotSupported } from '../domain/extraction.errors.js';
import type { DocumentExtractorPort } from '../domain/document-extractor.port.js';

@Injectable()
export class ExtractionAdapterRegistryService {
  private readonly adapters: readonly DocumentExtractorPort[];
  public constructor(
    pdf: PdfTextLayerExtractorService,
    image: NotConfiguredImageOcrAdapter,
  ) {
    this.adapters = [pdf, image];
  }
  public forMimeType(mimeType: string): DocumentExtractorPort {
    return (
      this.adapters.find((adapter) => adapter.supports(mimeType)) ??
      (() => {
        throw extractionNotSupported();
      })()
    );
  }
  public byKey(key: string): DocumentExtractorPort {
    return (
      this.adapters.find((adapter) => adapter.key === key) ??
      (() => {
        throw extractionNotSupported();
      })()
    );
  }
}
