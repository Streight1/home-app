import { Injectable } from '@nestjs/common';
import type { DocumentTypeKey } from '../../documents/domain/metadata/document-type.js';
import type {
  ExtractedFieldCandidate,
  ExtractedPage,
} from '../domain/extraction.types.js';
import { DocumentClassificationService } from './classification/document-classification.service.js';
import { InvoiceExtractionPipelineService } from './invoice/invoice-extraction-pipeline.service.js';
import { ResultNormalizationService } from './result-normalization.service.js';

@Injectable()
export class StructuredFieldExtractionService {
  public constructor(
    private readonly classification: DocumentClassificationService,
    private readonly invoices: InvoiceExtractionPipelineService,
    private readonly normalization: ResultNormalizationService,
  ) {}
  public extract(
    documentType: DocumentTypeKey,
    pages: readonly ExtractedPage[],
  ): ExtractedFieldCandidate[] {
    const classification = this.classification.classify(documentType, pages);
    if (classification === 'INVOICE') return this.invoices.extract(pages);
    if (classification === 'RECEIPT') return this.extractReceipt(pages);
    return [];
  }

  private extractReceipt(
    pages: readonly ExtractedPage[],
  ): ExtractedFieldCandidate[] {
    const definitions = [
      { key: 'merchantName', labels: ['prodejce', 'obchodník', 'merchant'] },
      { key: 'receiptNumber', labels: ['číslo účtenky', 'doklad č.'] },
      { key: 'purchaseDate', labels: ['datum nákupu', 'datum'] },
      { key: 'totalAmountMinor', labels: ['celkem', 'k úhradě'] },
      { key: 'paymentMethod', labels: ['způsob platby', 'platba'] },
    ] as const;
    const output: ExtractedFieldCandidate[] = [];
    for (const definition of definitions)
      for (const page of pages)
        for (const line of page.lines) {
          const label = definition.labels.find((candidate) =>
            line.text.toLowerCase().startsWith(candidate),
          );
          if (!label) continue;
          const rawValue = line.text
            .slice(label.length)
            .replace(/^\s*[:#-]?\s*/, '');
          const normalizedValue =
            definition.key === 'purchaseDate'
              ? this.normalization.normalizeDate(rawValue)
              : definition.key === 'totalAmountMinor'
                ? this.normalization.normalizeAmount(rawValue)
                : rawValue.trim();
          if (normalizedValue === null || normalizedValue === '') continue;
          output.push({
            fieldKey: definition.key,
            rawValue,
            normalizedValue,
            confidence: 0.88,
            confidenceReasons: ['EXACT_LABEL_MATCH', 'VALID_FORMAT'],
            sourcePage: page.page,
            sourceText: line.text.slice(0, 500),
            sourceRegion: {
              page: line.page,
              x: line.x,
              y: line.y,
              width: line.width,
              height: line.height,
            },
          });
          break;
        }
    const currency = this.normalization.normalizeCurrency(
      pages.map((page) => page.text).join('\n'),
    );
    if (currency)
      output.push({
        fieldKey: 'currencyCode',
        rawValue: currency,
        normalizedValue: currency,
        confidence: 0.76,
        confidenceReasons: ['VALID_FORMAT'],
        sourcePage: null,
        sourceText: null,
        sourceRegion: null,
      });
    return output;
  }
}
