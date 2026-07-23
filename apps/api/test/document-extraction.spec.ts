import { Readable } from 'node:stream';
import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ApiException } from '../src/common/errors/api-exception.js';
import type { DocumentsFacade } from '../src/modules/documents/documents.facade.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import { NotConfiguredImageOcrAdapter } from '../src/modules/document-extraction/adapters/not-configured-image-ocr.adapter.js';
import { PdfTextLayerExtractorService } from '../src/modules/document-extraction/adapters/pdf-text-layer-extractor.service.js';
import type { ExtractionAdapterRegistryService } from '../src/modules/document-extraction/application/extraction-adapter-registry.service.js';
import { ExtractionJobRunnerService } from '../src/modules/document-extraction/application/extraction-job-runner.service.js';
import { GetExtractionService } from '../src/modules/document-extraction/application/get-extraction.service.js';
import {
  normalizeAmountMinor,
  normalizeCzechDate,
  ResultNormalizationService,
} from '../src/modules/document-extraction/application/result-normalization.service.js';
import { ReviewExtractionFieldService } from '../src/modules/document-extraction/application/review-extraction-field.service.js';
import { StartExtractionService } from '../src/modules/document-extraction/application/start-extraction.service.js';
import { StructuredFieldExtractionService } from '../src/modules/document-extraction/application/structured-field-extraction.service.js';
import { DocumentClassificationService } from '../src/modules/document-extraction/application/classification/document-classification.service.js';
import { ConfidenceCalculationService } from '../src/modules/document-extraction/application/confidence/confidence-calculation.service.js';
import { CrossFieldValidationService } from '../src/modules/document-extraction/application/invoice/cross-field-validation.service.js';
import { GenericInvoiceExtractorService } from '../src/modules/document-extraction/application/invoice/generic-invoice-extractor.service.js';
import { InvoiceExtractionPipelineService } from '../src/modules/document-extraction/application/invoice/invoice-extraction-pipeline.service.js';
import { LineItemExtractionService } from '../src/modules/document-extraction/application/invoice/line-item-extraction.service.js';
import { PurchaseSummaryService } from '../src/modules/document-extraction/application/invoice/purchase-summary.service.js';
import { LayoutAnalysisService } from '../src/modules/document-extraction/application/layout/layout-analysis.service.js';
import { InvoiceNormalizationService } from '../src/modules/document-extraction/application/normalization/invoice-normalizers.js';
import { SupplierProfileRegistryService } from '../src/modules/document-extraction/application/supplier/supplier-profile-registry.service.js';
import type { DocumentExtractorPort } from '../src/modules/document-extraction/domain/document-extractor.port.js';
import type {
  ExtractionJobRecord,
  ExtractionRepository,
} from '../src/modules/document-extraction/domain/extraction.repository.js';

const householdId = '10000000-0000-4000-8000-000000000001';
const userId = '20000000-0000-4000-8000-000000000002';
const documentId = '30000000-0000-4000-8000-000000000003';
const jobId = '40000000-0000-4000-8000-000000000004';
const candidateId = '50000000-0000-4000-8000-000000000005';

function extractionJob(): ExtractionJobRecord {
  return {
    id: jobId,
    householdId,
    documentId,
    documentFileId: '60000000-0000-4000-8000-000000000006',
    documentType: 'INVOICE',
    status: 'REVIEW_REQUIRED',
    extractorKey: 'test',
    extractorVersion: '1.0.0',
    schemaVersion: 1,
    errorCode: null,
    startedAt: new Date('2026-07-14T10:00:00.000Z'),
    finishedAt: new Date('2026-07-14T10:00:01.000Z'),
    createdAt: new Date('2026-07-14T09:59:59.000Z'),
    rawText: 'Celkem: 1 234,50 Kč',
    candidates: [
      {
        id: candidateId,
        fieldKey: 'totalAmountMinor',
        rawValue: '1 234,50 Kč',
        normalizedValue: 123_450,
        confidence: 0.9,
        confidenceReasons: ['EXACT_LABEL_MATCH'],
        sourcePage: 1,
        sourceText: 'Celkem: 1 234,50 Kč',
        sourceRegion: null,
        status: 'PROPOSED',
        reviewedAt: null,
      },
    ],
  };
}

function repository(job: ExtractionJobRecord | null = extractionJob()) {
  const value = {
    createJob: vi.fn(),
    findJob: vi.fn().mockResolvedValue(job),
    markProcessing: vi.fn().mockResolvedValue(undefined),
    complete: vi.fn().mockResolvedValue(undefined),
    fail: vi.fn().mockResolvedValue(undefined),
    reviewCandidate: vi.fn().mockResolvedValue(undefined),
  };
  return { value, typed: value as unknown as ExtractionRepository };
}

function access(role = 'MEMBER') {
  return {
    getActiveMembership: vi
      .fn()
      .mockResolvedValue({ householdId, userId, role }),
  } as unknown as HouseholdAccessService;
}

function createTextPdf(lines: readonly string[]): Uint8Array {
  const content = lines
    .map(
      (line, index) =>
        `BT /F1 12 Tf 72 ${String(740 - index * 20)} Td (${line.replaceAll('(', '\\(').replaceAll(')', '\\)')}) Tj ET`,
    )
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${String(Buffer.byteLength(content))} >>\nstream\n${content}\nendstream`,
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(body));
    body += `${String(index + 1)} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${String(objects.length + 1)}\n0000000000 65535 f \n`;
  body += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  body += `trailer\n<< /Size ${String(objects.length + 1)} /Root 1 0 R >>\nstartxref\n${String(xref)}\n%%EOF`;
  return Uint8Array.from(Buffer.from(body));
}

function structuredService(): StructuredFieldExtractionService {
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

function extractedPage(lines: readonly string[]) {
  const layout = new LayoutAnalysisService();
  return layout.analyze(
    1,
    lines.map((text, order) => ({
      text,
      page: 1,
      x: 20,
      y: 700 - order * 24,
      width: text.length * 6,
      height: 12,
      order,
      confidence: null,
    })),
  );
}

describe('document extraction pipeline', () => {
  it('normalizes Czech dates and rejects impossible dates', () => {
    expect(normalizeCzechDate('14. 7. 2026')).toBe('2026-07-14');
    expect(normalizeCzechDate('31. 2. 2026')).toBeNull();
  });

  it('normalizes monetary values to integer minor units without floats', () => {
    expect(normalizeAmountMinor('1 234,50 Kč')).toBe(123_450);
    expect(normalizeAmountMinor('12.345,67 CZK')).toBe(1_234_567);
    expect(Number.isInteger(normalizeAmountMinor('10,99 EUR'))).toBe(true);
  });

  it('extracts supported invoice and receipt candidates with bounded confidence', () => {
    const service = structuredService();
    const invoice = service.extract('INVOICE', [
      extractedPage([
        'Dodavatel: Acme s.r.o.',
        'Datum splatnosti: 14. 8. 2026',
        'Celkem k úhradě: 1 234,50 Kč',
      ]),
    ]);
    const receipt = service.extract('RECEIPT', [
      extractedPage(['Prodejce: Obchod', 'Celkem: 99,90 CZK']),
    ]);
    expect(invoice).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'supplierName' }),
        expect.objectContaining({
          fieldKey: 'totalAmountMinor',
          normalizedValue: 123_450,
        }),
      ]),
    );
    expect(receipt).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'merchantName' }),
      ]),
    );
    expect(
      [...invoice, ...receipt].every(
        (item) => item.confidence >= 0 && item.confidence <= 1,
      ),
    ).toBe(true);
  });

  it('extracts actual text from a PDF text layer', async () => {
    const structured = structuredService();
    const adapter = new PdfTextLayerExtractorService(structured);
    const output = await adapter.extract(
      {
        mimeType: 'application/pdf',
        documentType: 'INVOICE',
        buffer: createTextPdf(['Invoice number: 2026-001']),
      },
      new AbortController().signal,
    );
    expect(output.rawText).toContain('Invoice number');
    expect(output.pages).toHaveLength(1);
    expect(output.pages[0]?.blocks[0]).toMatchObject({
      page: 1,
      text: expect.stringContaining('Invoice number'),
      x: expect.any(Number),
      y: expect.any(Number),
      width: expect.any(Number),
      height: expect.any(Number),
      order: 0,
    });
  });

  it('fails explicitly when image OCR is not configured', () => {
    const adapter = new NotConfiguredImageOcrAdapter();
    expect(() =>
      adapter.extract({
        mimeType: 'image/png',
        documentType: 'RECEIPT',
        buffer: new Uint8Array([1]),
      }),
    ).toThrow(expect.objectContaining({ code: 'OCR_NOT_CONFIGURED' }));
  });

  it('marks a timed-out asynchronous job as failed with a safe code', async () => {
    const jobs = repository(null);
    const adapter: DocumentExtractorPort = {
      key: 'slow',
      version: '1',
      supports: () => true,
      extract: (_input, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => reject(new Error('Extrakce zrušena.')),
            {
              once: true,
            },
          );
        }),
    };
    const documents = {
      getExtractionSource: vi.fn().mockResolvedValue({
        mimeType: 'application/pdf',
        documentType: 'INVOICE',
        stream: Readable.from('pdf'),
      }),
    } as unknown as DocumentsFacade;
    const adapters = {
      byKey: vi.fn().mockReturnValue(adapter),
    } as unknown as ExtractionAdapterRegistryService;
    await new ExtractionJobRunnerService(documents, adapters, jobs.typed).run(
      { jobId, userId, documentId, extractorKey: 'slow' },
      5,
    );
    expect(jobs.value.fail).toHaveBeenCalledWith(jobId, 'EXTRACTION_TIMEOUT');
    expect(jobs.value.complete).not.toHaveBeenCalled();
  });

  it('marks unexpected extractor failures without exposing details', async () => {
    const jobs = repository(null);
    const adapter = {
      key: 'broken',
      version: '1',
      supports: () => true,
      extract: vi.fn().mockRejectedValue(new Error('secret provider detail')),
    } as DocumentExtractorPort;
    const documents = {
      getExtractionSource: vi.fn().mockResolvedValue({
        mimeType: 'application/pdf',
        documentType: 'INVOICE',
        stream: Readable.from('pdf'),
      }),
    } as unknown as DocumentsFacade;
    const adapters = {
      byKey: vi.fn().mockReturnValue(adapter),
    } as unknown as ExtractionAdapterRegistryService;
    await new ExtractionJobRunnerService(documents, adapters, jobs.typed).run({
      jobId,
      userId,
      documentId,
      extractorKey: 'broken',
    });
    expect(jobs.value.fail).toHaveBeenCalledWith(jobId, 'EXTRACTION_FAILED');
  });

  it('applies an accepted candidate only after explicit review', async () => {
    const jobs = repository();
    const documents = {
      applyExtractionFields: vi.fn().mockResolvedValue({}),
    } as unknown as DocumentsFacade;
    const service = new ReviewExtractionFieldService(
      access(),
      documents,
      jobs.typed,
    );
    await service.execute(userId, documentId, jobId, candidateId, 'ACCEPTED');
    expect(documents.applyExtractionFields).toHaveBeenCalledWith(
      userId,
      documentId,
      jobId,
      { totalAmountMinor: 123_450 },
    );
  });

  it('does not change document metadata for a rejected candidate', async () => {
    const jobs = repository();
    const documents = {
      applyExtractionFields: vi.fn(),
    } as unknown as DocumentsFacade;
    const service = new ReviewExtractionFieldService(
      access(),
      documents,
      jobs.typed,
    );
    await service.execute(userId, documentId, jobId, candidateId, 'REJECTED');
    expect(documents.applyExtractionFields).not.toHaveBeenCalled();
  });

  it('does not overwrite a confirmed field through bulk safe acceptance', async () => {
    const jobs = repository();
    const documents = {
      getSafeSummary: vi.fn().mockResolvedValue({
        metadata: { totalAmountMinor: 99_900 },
      }),
      applyExtractionFields: vi.fn(),
    } as unknown as DocumentsFacade;
    const service = new ReviewExtractionFieldService(
      access(),
      documents,
      jobs.typed,
    );
    await service.acceptSafe(userId, documentId, jobId);
    expect(documents.applyExtractionFields).not.toHaveBeenCalled();
    expect(jobs.value.reviewCandidate).not.toHaveBeenCalled();
  });

  it('creates a new job for every extraction run without replacing history', async () => {
    const documents = {
      getExtractionDescriptor: vi.fn().mockResolvedValue({
        householdId,
        documentFileId: '60000000-0000-4000-8000-000000000006',
        documentType: 'INVOICE',
        mimeType: 'application/pdf',
        schemaVersion: 2,
      }),
    } as unknown as DocumentsFacade;
    const adapters = {
      forMimeType: vi
        .fn()
        .mockReturnValue({ key: 'pdf-layout-v2', version: '2.0.0' }),
    } as unknown as ExtractionAdapterRegistryService;
    const createdIds: string[] = [];
    const jobs = repository(null);
    jobs.value.createJob.mockImplementation((input) => {
      createdIds.push(input.id);
      return Promise.resolve({ ...extractionJob(), id: input.id });
    });
    const runner = {
      enqueue: vi.fn(),
    } as unknown as ExtractionJobRunnerService;
    const service = new StartExtractionService(
      documents,
      adapters,
      jobs.typed,
      runner,
    );
    await service.execute(userId, documentId);
    await service.execute(userId, documentId);
    expect(createdIds).toHaveLength(2);
    expect(new Set(createdIds).size).toBe(2);
    expect(runner.enqueue).toHaveBeenCalledTimes(2);
  });

  it('prevents a VIEWER from confirming extraction candidates', async () => {
    const denied = {
      getActiveMembership: vi
        .fn()
        .mockRejectedValue(
          new ApiException(
            HttpStatus.FORBIDDEN,
            'HOUSEHOLD_ACCESS_DENIED',
            'Zakázáno.',
          ),
        ),
    } as unknown as HouseholdAccessService;
    const service = new ReviewExtractionFieldService(
      denied,
      {} as DocumentsFacade,
      repository().typed,
    );
    await expect(
      service.execute(userId, documentId, jobId, candidateId, 'ACCEPTED'),
    ).rejects.toMatchObject({ code: 'HOUSEHOLD_ACCESS_DENIED' });
  });

  it('does not reveal an extraction job from another household', async () => {
    const jobs = repository(null);
    const service = new GetExtractionService(access('VIEWER'), jobs.typed);
    await expect(
      service.execute(userId, documentId, jobId),
    ).rejects.toMatchObject({ code: 'EXTRACTION_NOT_FOUND' });
    expect(jobs.value.findJob).toHaveBeenCalledWith(
      householdId,
      documentId,
      jobId,
    );
  });
});
