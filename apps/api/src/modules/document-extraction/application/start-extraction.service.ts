import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DocumentsFacade } from '../../documents/documents.facade.js';
import {
  EXTRACTION_REPOSITORY,
  type ExtractionRepository,
} from '../domain/extraction.repository.js';
import { ExtractionAdapterRegistryService } from './extraction-adapter-registry.service.js';
import { ExtractionJobRunnerService } from './extraction-job-runner.service.js';
import { mapExtractionJob } from './extraction-response.mapper.js';

@Injectable()
export class StartExtractionService {
  public constructor(
    private readonly documents: DocumentsFacade,
    private readonly adapters: ExtractionAdapterRegistryService,
    @Inject(EXTRACTION_REPOSITORY) private readonly jobs: ExtractionRepository,
    private readonly runner: ExtractionJobRunnerService,
  ) {}
  public async execute(userId: string, documentId: string) {
    const source = await this.documents.getExtractionDescriptor(
      userId,
      documentId,
    );
    const adapter = this.adapters.forMimeType(source.mimeType);
    const job = await this.jobs.createJob({
      id: randomUUID(),
      householdId: source.householdId,
      documentId,
      documentFileId: source.documentFileId,
      documentType: source.documentType,
      extractorKey: adapter.key,
      extractorVersion: adapter.version,
      schemaVersion: source.schemaVersion,
      userId,
    });
    this.runner.enqueue({
      jobId: job.id,
      userId,
      documentId,
      extractorKey: adapter.key,
    });
    return mapExtractionJob(job);
  }
}
