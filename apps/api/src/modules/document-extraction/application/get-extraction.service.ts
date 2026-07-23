import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  EXTRACTION_REPOSITORY,
  type ExtractionRepository,
} from '../domain/extraction.repository.js';
import { extractionNotFound } from '../domain/extraction.errors.js';
import { mapExtractionJob } from './extraction-response.mapper.js';

@Injectable()
export class GetExtractionService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(EXTRACTION_REPOSITORY) private readonly jobs: ExtractionRepository,
  ) {}
  public async execute(userId: string, documentId: string, jobId: string) {
    const membership = await this.access.getActiveMembership(userId, 'VIEWER');
    const job = await this.jobs.findJob(
      membership.householdId,
      documentId,
      jobId,
    );
    if (!job) throw extractionNotFound();
    return mapExtractionJob(job);
  }
}
