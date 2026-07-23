import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { PdfTextLayerExtractorService } from './adapters/pdf-text-layer-extractor.service.js';
import { NotConfiguredImageOcrAdapter } from './adapters/not-configured-image-ocr.adapter.js';
import { ExtractionAdapterRegistryService } from './application/extraction-adapter-registry.service.js';
import { ExtractionJobRunnerService } from './application/extraction-job-runner.service.js';
import { GetExtractionService } from './application/get-extraction.service.js';
import { ResultNormalizationService } from './application/result-normalization.service.js';
import { ReviewExtractionFieldService } from './application/review-extraction-field.service.js';
import { StartExtractionService } from './application/start-extraction.service.js';
import { StructuredFieldExtractionService } from './application/structured-field-extraction.service.js';
import { LayoutAnalysisService } from './application/layout/layout-analysis.service.js';
import { DocumentClassificationService } from './application/classification/document-classification.service.js';
import { SupplierProfileRegistryService } from './application/supplier/supplier-profile-registry.service.js';
import { ConfidenceCalculationService } from './application/confidence/confidence-calculation.service.js';
import { InvoiceNormalizationService } from './application/normalization/invoice-normalizers.js';
import { GenericInvoiceExtractorService } from './application/invoice/generic-invoice-extractor.service.js';
import { LineItemExtractionService } from './application/invoice/line-item-extraction.service.js';
import { PurchaseSummaryService } from './application/invoice/purchase-summary.service.js';
import { CrossFieldValidationService } from './application/invoice/cross-field-validation.service.js';
import { InvoiceExtractionPipelineService } from './application/invoice/invoice-extraction-pipeline.service.js';
import { EXTRACTION_REPOSITORY } from './domain/extraction.repository.js';
import { PrismaExtractionRepository } from './infrastructure/prisma-extraction.repository.js';
import { DocumentExtractionController } from './presentation/document-extraction.controller.js';

@Module({
  imports: [DocumentsModule, HouseholdsModule],
  controllers: [DocumentExtractionController],
  providers: [
    PrismaExtractionRepository,
    { provide: EXTRACTION_REPOSITORY, useExisting: PrismaExtractionRepository },
    ResultNormalizationService,
    InvoiceNormalizationService,
    LayoutAnalysisService,
    DocumentClassificationService,
    SupplierProfileRegistryService,
    ConfidenceCalculationService,
    GenericInvoiceExtractorService,
    LineItemExtractionService,
    PurchaseSummaryService,
    CrossFieldValidationService,
    InvoiceExtractionPipelineService,
    StructuredFieldExtractionService,
    PdfTextLayerExtractorService,
    NotConfiguredImageOcrAdapter,
    ExtractionAdapterRegistryService,
    ExtractionJobRunnerService,
    StartExtractionService,
    GetExtractionService,
    ReviewExtractionFieldService,
  ],
})
export class DocumentExtractionModule {}
