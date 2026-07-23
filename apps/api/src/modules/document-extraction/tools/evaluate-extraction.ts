import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { PdfTextLayerExtractorService } from '../adapters/pdf-text-layer-extractor.service.js';
import { DocumentClassificationService } from '../application/classification/document-classification.service.js';
import { ConfidenceCalculationService } from '../application/confidence/confidence-calculation.service.js';
import { CrossFieldValidationService } from '../application/invoice/cross-field-validation.service.js';
import { GenericInvoiceExtractorService } from '../application/invoice/generic-invoice-extractor.service.js';
import { InvoiceExtractionPipelineService } from '../application/invoice/invoice-extraction-pipeline.service.js';
import { LineItemExtractionService } from '../application/invoice/line-item-extraction.service.js';
import { PurchaseSummaryService } from '../application/invoice/purchase-summary.service.js';
import { LayoutAnalysisService } from '../application/layout/layout-analysis.service.js';
import { InvoiceNormalizationService } from '../application/normalization/invoice-normalizers.js';
import { ResultNormalizationService } from '../application/result-normalization.service.js';
import { StructuredFieldExtractionService } from '../application/structured-field-extraction.service.js';
import { SupplierProfileRegistryService } from '../application/supplier/supplier-profile-registry.service.js';
import { resolveEvaluatorInput } from './evaluator-path.js';

function argument(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function main(): Promise<void> {
  const file = argument('--file');
  if (!file)
    throw new Error(
      'Použití: --file <path> --type INVOICE [--expected <json>]',
    );
  const type = argument('--type') ?? 'INVOICE';
  if (type !== 'INVOICE')
    throw new Error('Evaluator v této verzi podporuje typ INVOICE.');
  const normalization = new InvoiceNormalizationService();
  const pipeline = new InvoiceExtractionPipelineService(
    new SupplierProfileRegistryService(),
    new GenericInvoiceExtractorService(normalization),
    new LineItemExtractionService(normalization),
    new PurchaseSummaryService(),
    new ConfidenceCalculationService(),
    new CrossFieldValidationService(),
  );
  const structured = new StructuredFieldExtractionService(
    new DocumentClassificationService(),
    pipeline,
    new ResultNormalizationService(),
  );
  const extractor = new PdfTextLayerExtractorService(
    structured,
    new LayoutAnalysisService(),
  );
  const result = await extractor.extract(
    {
      mimeType: 'application/pdf',
      documentType: 'INVOICE',
      buffer: Uint8Array.from(await readFile(resolveEvaluatorInput(file))),
    },
    new AbortController().signal,
  );
  const values = Object.fromEntries(
    result.candidates.map((candidate) => [
      candidate.fieldKey,
      candidate.normalizedValue,
    ]),
  );
  const output: Record<string, unknown> = {
    fields: result.candidates.map((candidate) => ({
      key: candidate.fieldKey,
      confidence: candidate.confidence,
      reasons: candidate.confidenceReasons,
    })),
  };
  if (process.argv.includes('--debug-values')) output.values = values;
  const expectedPath = argument('--expected');
  if (expectedPath) {
    const expected = JSON.parse(
      await readFile(resolveEvaluatorInput(expectedPath), 'utf8'),
    ) as Record<string, unknown>;
    const keys = Object.keys(values);
    const expectedKeys = Object.keys(expected);
    const exact = expectedKeys.filter(
      (key) => canonicalJson(values[key]) === canonicalJson(expected[key]),
    ).length;
    const hallucinated = keys.filter((key) => !(key in expected)).length;
    const missingFields = expectedKeys.filter((key) => !(key in values));
    const mismatchedFields = expectedKeys.filter(
      (key) =>
        key in values &&
        canonicalJson(values[key]) !== canonicalJson(expected[key]),
    );
    output.quality = {
      precision: keys.length === 0 ? 0 : exact / keys.length,
      recall: expectedKeys.length === 0 ? 1 : exact / expectedKeys.length,
      exactMatches: exact,
      hallucinatedFields: hallucinated,
      missingFields,
      mismatchedFields,
    };
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

await main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Evaluator selhal.'}\n`,
  );
  process.exitCode = 1;
});
