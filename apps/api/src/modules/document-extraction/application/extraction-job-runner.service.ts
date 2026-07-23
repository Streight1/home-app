import { setTimeout as delay } from 'node:timers/promises';
import { Injectable, Logger } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';
import { DocumentsFacade } from '../../documents/documents.facade.js';
import {
  EXTRACTION_REPOSITORY,
  type ExtractionRepository,
} from '../domain/extraction.repository.js';
import { extractionTimeout } from '../domain/extraction.errors.js';
import { ExtractionAdapterRegistryService } from './extraction-adapter-registry.service.js';
import { Inject } from '@nestjs/common';

const extractionTimeoutMilliseconds = 20_000;

async function streamBuffer(
  stream: NodeJS.ReadableStream,
): Promise<Uint8Array> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Uint8Array.from(Buffer.concat(chunks));
}

@Injectable()
export class ExtractionJobRunnerService {
  private readonly logger = new Logger(ExtractionJobRunnerService.name);
  public constructor(
    private readonly documents: DocumentsFacade,
    private readonly adapters: ExtractionAdapterRegistryService,
    @Inject(EXTRACTION_REPOSITORY) private readonly jobs: ExtractionRepository,
  ) {}

  public enqueue(input: {
    jobId: string;
    userId: string;
    documentId: string;
    extractorKey: string;
  }): void {
    setImmediate(() => {
      void this.run(input);
    });
  }

  public async run(
    input: {
      jobId: string;
      userId: string;
      documentId: string;
      extractorKey: string;
    },
    timeoutMs = extractionTimeoutMilliseconds,
  ): Promise<void> {
    await this.jobs.markProcessing(input.jobId);
    const controller = new AbortController();
    try {
      const source = await this.documents.getExtractionSource(
        input.userId,
        input.documentId,
      );
      const adapter = this.adapters.byKey(input.extractorKey);
      const extraction = adapter.extract(
        {
          mimeType: source.mimeType,
          buffer: await streamBuffer(source.stream),
          documentType: source.documentType,
        },
        controller.signal,
      );
      const timeout = delay(timeoutMs, undefined, {
        signal: controller.signal,
      }).then(() => {
        throw extractionTimeout();
      });
      const result = await Promise.race([extraction, timeout]);
      controller.abort();
      await this.jobs.complete(input.jobId, result.rawText, result.candidates);
    } catch (error) {
      controller.abort();
      const code =
        error instanceof ApiException ? error.code : 'EXTRACTION_FAILED';
      this.logger.warn({ code, jobId: input.jobId });
      await this.jobs.fail(input.jobId, code);
    }
  }
}
