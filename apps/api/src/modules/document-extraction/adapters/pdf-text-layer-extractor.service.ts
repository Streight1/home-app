import { Injectable } from '@nestjs/common';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { extractionNotSupported } from '../domain/extraction.errors.js';
import type { DocumentExtractorPort } from '../domain/document-extractor.port.js';
import type {
  ExtractionInput,
  ExtractionOutput,
  ExtractedPage,
  LayoutTextBlock,
} from '../domain/extraction.types.js';
import { StructuredFieldExtractionService } from '../application/structured-field-extraction.service.js';
import { LayoutAnalysisService } from '../application/layout/layout-analysis.service.js';

@Injectable()
export class PdfTextLayerExtractorService implements DocumentExtractorPort {
  public readonly key = 'pdf-text-layer';
  public readonly version = '2.0.0';
  public constructor(
    private readonly structured: StructuredFieldExtractionService,
    private readonly layout: LayoutAnalysisService = new LayoutAnalysisService(),
  ) {}
  public supports(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  public async extract(
    input: ExtractionInput,
    signal: AbortSignal,
  ): Promise<ExtractionOutput> {
    if (!this.supports(input.mimeType)) throw extractionNotSupported();
    signal.throwIfAborted();
    const loadingTask = getDocument({
      data: input.buffer,
      useSystemFonts: true,
    });
    const abort = () => {
      void loadingTask.destroy();
    };
    signal.addEventListener('abort', abort, { once: true });
    try {
      const pdf = await loadingTask.promise;
      const pages: ExtractedPage[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        signal.throwIfAborted();
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const blocks: LayoutTextBlock[] = [];
        let order = 0;
        for (const item of content.items) {
          if (!('str' in item)) continue;
          const transform: unknown = item.transform;
          const x: unknown = Array.isArray(transform)
            ? transform[4]
            : undefined;
          const y: unknown = Array.isArray(transform)
            ? transform[5]
            : undefined;
          blocks.push({
            text: item.str,
            page: pageNumber,
            x: typeof x === 'number' ? x : 0,
            y: typeof y === 'number' ? y : 0,
            width: item.width,
            height: item.height,
            order,
            confidence: null,
          });
          order += 1;
        }
        pages.push(this.layout.analyze(pageNumber, blocks));
      }
      const rawText = pages
        .map((page) => page.text)
        .join('\n\n')
        .slice(0, 1_000_000);
      return {
        rawText,
        pages,
        candidates: this.structured.extract(input.documentType, pages),
      };
    } finally {
      signal.removeEventListener('abort', abort);
      await loadingTask.destroy().catch(() => undefined);
    }
  }
}
