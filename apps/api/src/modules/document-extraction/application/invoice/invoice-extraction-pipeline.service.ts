import { Injectable } from '@nestjs/common';
import type {
  ExtractedFieldCandidate,
  ExtractedPage,
} from '../../domain/extraction.types.js';
import { ConfidenceCalculationService } from '../confidence/confidence-calculation.service.js';
import { SupplierProfileRegistryService } from '../supplier/supplier-profile-registry.service.js';
import { CrossFieldValidationService } from './cross-field-validation.service.js';
import { GenericInvoiceExtractorService } from './generic-invoice-extractor.service.js';
import { LineItemExtractionService } from './line-item-extraction.service.js';
import { PurchaseSummaryService } from './purchase-summary.service.js';

@Injectable()
export class InvoiceExtractionPipelineService {
  public constructor(
    private readonly supplierProfiles: SupplierProfileRegistryService,
    private readonly generic: GenericInvoiceExtractorService,
    private readonly lineItems: LineItemExtractionService,
    private readonly summaries: PurchaseSummaryService,
    private readonly confidence: ConfidenceCalculationService,
    private readonly crossField: CrossFieldValidationService,
  ) {}
  public extract(pages: readonly ExtractedPage[]): ExtractedFieldCandidate[] {
    const profile = this.supplierProfiles.detect(pages);
    const candidates: ExtractedFieldCandidate[] = this.generic
      .extract(pages, profile)
      .map((candidate) => ({
        fieldKey: candidate.fieldKey,
        rawValue: candidate.rawValue,
        normalizedValue: candidate.normalizedValue,
        confidence: this.confidence.calculate(candidate),
        confidenceReasons: [
          ...candidate.confidenceReasons,
          ...(candidate.profileMatch
            ? ['SUPPLIER_PROFILE_MATCH' as const]
            : []),
          ...(candidate.line.blocks.some(
            (block) => (block.confidence ?? 1) < 0.7,
          )
            ? ['OCR_LOW_CONFIDENCE' as const]
            : []),
        ],
        sourcePage: candidate.line.page,
        sourceText: candidate.line.text.slice(0, 500),
        sourceRegion: {
          page: candidate.line.page,
          x: candidate.line.x,
          y: candidate.line.y,
          width: candidate.line.width,
          height: candidate.line.height,
        },
      }));
    const extractedItems = this.lineItems.extract(pages);
    if (extractedItems.items.length > 0 && extractedItems.sourceLine) {
      const line = extractedItems.sourceLine;
      candidates.push({
        fieldKey: 'lineItems',
        rawValue: `${String(extractedItems.items.length)} položek`,
        normalizedValue: extractedItems.items,
        confidence: 0.86,
        confidenceReasons: ['VALID_FORMAT'],
        sourcePage: line.page,
        sourceText: line.text.slice(0, 500),
        sourceRegion: {
          page: line.page,
          x: line.x,
          y: line.y,
          width: line.width,
          height: line.height,
        },
      });
      const summary = this.summaries.create(extractedItems.items);
      if (summary)
        candidates.push({
          fieldKey: 'purchaseSummary',
          rawValue: summary,
          normalizedValue: summary,
          confidence: 0.84,
          confidenceReasons: ['VALID_FORMAT'],
          sourcePage: line.page,
          sourceText: line.text.slice(0, 500),
          sourceRegion: {
            page: line.page,
            x: line.x,
            y: line.y,
            width: line.width,
            height: line.height,
          },
        });
    }
    if (
      !candidates.some((candidate) => candidate.fieldKey === 'currencyCode')
    ) {
      const currency = /\b(CZK|EUR)\b|Kč|€/i.exec(
        pages.map((page) => page.text).join('\n'),
      )?.[0];
      const total = candidates.find(
        (candidate) => candidate.fieldKey === 'totalAmountMinor',
      );
      if (currency && total)
        candidates.push({
          fieldKey: 'currencyCode',
          rawValue: currency,
          normalizedValue: /EUR|€/i.test(currency) ? 'EUR' : 'CZK',
          confidence: 0.78,
          confidenceReasons: ['VALID_FORMAT'],
          sourcePage: total.sourcePage,
          sourceText: total.sourceText,
          sourceRegion: total.sourceRegion,
        });
    }
    return this.crossField.validate(candidates);
  }
}
