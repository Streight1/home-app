import { describe, expect, it } from 'vitest';
import { DocumentClassificationService } from '../src/modules/document-extraction/application/classification/document-classification.service.js';
import { ConfidenceCalculationService } from '../src/modules/document-extraction/application/confidence/confidence-calculation.service.js';
import { CrossFieldValidationService } from '../src/modules/document-extraction/application/invoice/cross-field-validation.service.js';
import { GenericInvoiceExtractorService } from '../src/modules/document-extraction/application/invoice/generic-invoice-extractor.service.js';
import { InvoiceExtractionPipelineService } from '../src/modules/document-extraction/application/invoice/invoice-extraction-pipeline.service.js';
import { LineItemExtractionService } from '../src/modules/document-extraction/application/invoice/line-item-extraction.service.js';
import { PurchaseSummaryService } from '../src/modules/document-extraction/application/invoice/purchase-summary.service.js';
import { LayoutAnalysisService } from '../src/modules/document-extraction/application/layout/layout-analysis.service.js';
import {
  IbanNormalizer,
  InvoiceNormalizationService,
} from '../src/modules/document-extraction/application/normalization/invoice-normalizers.js';
import { ResultNormalizationService } from '../src/modules/document-extraction/application/result-normalization.service.js';
import { StructuredFieldExtractionService } from '../src/modules/document-extraction/application/structured-field-extraction.service.js';
import { SupplierProfileRegistryService } from '../src/modules/document-extraction/application/supplier/supplier-profile-registry.service.js';
import { resolveEvaluatorInput } from '../src/modules/document-extraction/tools/evaluator-path.js';

function extractor() {
  const normalization = new InvoiceNormalizationService();
  return new StructuredFieldExtractionService(
    new DocumentClassificationService(),
    new InvoiceExtractionPipelineService(
      new SupplierProfileRegistryService(),
      new GenericInvoiceExtractorService(normalization),
      new LineItemExtractionService(normalization),
      new PurchaseSummaryService(),
      new ConfidenceCalculationService(),
      new CrossFieldValidationService(),
    ),
    new ResultNormalizationService(),
  );
}

function page(lines: readonly string[]) {
  return new LayoutAnalysisService().analyze(
    1,
    lines.map((text, order) => ({
      text,
      page: 1,
      x: order % 2 === 0 ? 32 : 280,
      y: 760 - order * 24,
      width: Math.max(20, text.length * 5),
      height: 12,
      order,
      confidence: null,
    })),
  );
}

function values(lines: readonly string[]) {
  return Object.fromEntries(
    extractor()
      .extract('INVOICE', [page(lines)])
      .map((candidate) => [candidate.fieldKey, candidate.normalizedValue]),
  );
}

describe('layout-aware invoice extraction v2', () => {
  it('resolves evaluator inputs from the original invocation directory', () => {
    expect(resolveEvaluatorInput('fixture.pdf', '/workspace/homeapp')).toBe(
      '/workspace/homeapp/fixture.pdf',
    );
    expect(
      resolveEvaluatorInput('/tmp/fixture.pdf', '/workspace/homeapp'),
    ).toBe('/tmp/fixture.pdf');
  });
  it('distinguishes a labelled supplier from the customer company', () => {
    const result = values([
      'Dodavatel: Dodavatel Test s.r.o.',
      'Odběratel: Domácnost Test s.r.o.',
      'Číslo faktury: FV-2026-101',
    ]);
    expect(result.supplierName).toBe('Dodavatel Test s.r.o.');
  });

  it('does not confuse invoice/order numbers, issue/due dates or item/total amounts', () => {
    const result = values([
      'Číslo faktury: FV-2026-101',
      'Číslo objednávky: OBJ-777',
      'Datum vystavení: 14. 7. 2026',
      'Datum splatnosti: 28. 7. 2026',
      'Notebook Test | 1 | ks | 35 000,00 CZK | 35 000,00 CZK',
      'Celkem k úhradě: 38 990,00 CZK',
    ]);
    expect(result).toMatchObject({
      invoiceNumber: 'FV-2026-101',
      orderNumber: 'OBJ-777',
      issueDate: '2026-07-14',
      dueDate: '2026-07-28',
      totalAmountMinor: 3_899_000,
    });
  });

  it('extracts line items and creates a meaningful purchase summary', () => {
    const result = values([
      'Alza.cz a.s. www.alza.cz',
      'Dodavatel: Alza.cz',
      'Notebook Lenovo ThinkPad | 1 | ks | 35 000,00 CZK | 35 000,00 CZK',
      'Myš bezdrátová | 1 | ks | 990,00 CZK | 990,00 CZK',
      'Celkem k úhradě: 35 990,00 CZK',
    ]);
    expect(result.lineItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ description: 'Notebook Lenovo ThinkPad' }),
      ]),
    );
    expect(result.purchaseSummary).toContain('Notebook Lenovo ThinkPad');
  });

  it('normalizes variable symbols and validates IBAN checksum', () => {
    const result = values(['Variabilní symbol: 123 456 7890']);
    expect(result.variableSymbol).toBe('1234567890');
    expect(new IbanNormalizer().normalize('GB82 WEST 1234 5698 7654 32')).toBe(
      'GB82WEST12345698765432',
    );
    expect(
      new IbanNormalizer().normalize('GB00 WEST 1234 5698 7654 32'),
    ).toBeNull();
  });

  it('lowers confidence for conflicting values and inconsistent totals', () => {
    const candidates = extractor().extract('INVOICE', [
      page([
        'Číslo faktury: FV-1',
        'Číslo faktury: FV-2',
        'Základ daně: 100,00 CZK',
        'DPH celkem: 21,00 CZK',
        'Celkem k úhradě: 150,00 CZK',
      ]),
    ]);
    expect(
      candidates.find((candidate) => candidate.fieldKey === 'invoiceNumber'),
    ).toMatchObject({
      confidenceReasons: expect.arrayContaining([
        'MULTIPLE_CONFLICTING_VALUES',
      ]),
    });
    expect(
      candidates.find((candidate) => candidate.fieldKey === 'totalAmountMinor'),
    ).toMatchObject({
      confidenceReasons: expect.arrayContaining(['TOTALS_INCONSISTENT']),
    });
  });

  it('meets the synthetic invoice quality gate without hallucinating core fields', () => {
    const result = values([
      'Alza.cz a.s. www.alza.cz',
      'Dodavatel: Alza.cz',
      'Číslo faktury: FV-SYN-2026-77',
      'Variabilní symbol: 2026077001',
      'Datum vystavení: 14. 7. 2026',
      'Datum splatnosti: 28. 7. 2026',
      'Notebook Lenovo ThinkPad | 1 | ks | 38 990,00 CZK | 38 990,00 CZK',
      'Celkem k úhradě: 38 990,00 CZK',
    ]);
    expect(result).toMatchObject({
      supplierName: 'Alza.cz',
      invoiceNumber: 'FV-SYN-2026-77',
      variableSymbol: '2026077001',
      issueDate: '2026-07-14',
      dueDate: '2026-07-28',
      totalAmountMinor: 3_899_000,
      currencyCode: 'CZK',
      purchaseSummary: expect.stringContaining('Notebook Lenovo ThinkPad'),
      lineItems: expect.arrayContaining([
        expect.objectContaining({ description: 'Notebook Lenovo ThinkPad' }),
      ]),
    });
  });
});
