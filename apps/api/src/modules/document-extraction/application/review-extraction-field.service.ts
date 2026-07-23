import { Inject, Injectable } from '@nestjs/common';
import { DocumentsFacade } from '../../documents/documents.facade.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  EXTRACTION_REPOSITORY,
  type ExtractionRepository,
} from '../domain/extraction.repository.js';
import {
  extractionNotFound,
  invalidExtractionReview,
} from '../domain/extraction.errors.js';
import type { ExtractionFieldStatus } from '../domain/extraction.types.js';
import type { ExtractedValue } from '../domain/extraction.types.js';
import { mapExtractionJob } from './extraction-response.mapper.js';

type ReviewStatus = Exclude<ExtractionFieldStatus, 'PROPOSED'>;

@Injectable()
export class ReviewExtractionFieldService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly documents: DocumentsFacade,
    @Inject(EXTRACTION_REPOSITORY) private readonly jobs: ExtractionRepository,
  ) {}
  public async execute(
    userId: string,
    documentId: string,
    jobId: string,
    candidateId: string,
    status: ReviewStatus,
    editedValue?: unknown,
  ) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const job = await this.jobs.findJob(
      membership.householdId,
      documentId,
      jobId,
    );
    const candidate = job?.candidates.find((item) => item.id === candidateId);
    if (!job || !candidate) throw extractionNotFound();
    const value = status === 'EDITED' ? editedValue : candidate.normalizedValue;
    if (
      status === 'EDITED' &&
      !['string', 'number', 'boolean'].includes(typeof value)
    )
      throw invalidExtractionReview('Upravená hodnota není platná.');
    if (status !== 'REJECTED')
      await this.documents.applyExtractionFields(userId, documentId, jobId, {
        [candidate.fieldKey]: value as ExtractedValue,
      });
    await this.jobs.reviewCandidate({
      jobId,
      candidateId,
      userId,
      status,
      normalizedValue: value as ExtractedValue,
    });
    const updated = await this.jobs.findJob(
      membership.householdId,
      documentId,
      jobId,
    );
    if (!updated) throw extractionNotFound();
    return mapExtractionJob(updated);
  }

  public async acceptSafe(userId: string, documentId: string, jobId: string) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const job = await this.jobs.findJob(
      membership.householdId,
      documentId,
      jobId,
    );
    if (!job) throw extractionNotFound();
    const document = await this.documents.getSafeSummary(userId, documentId);
    const confirmedFields = new Set(Object.keys(document.metadata));
    for (const candidate of job.candidates.filter(
      (item) =>
        item.status === 'PROPOSED' &&
        item.confidence >= 0.85 &&
        !confirmedFields.has(item.fieldKey),
    )) {
      await this.execute(userId, documentId, jobId, candidate.id, 'ACCEPTED');
    }
    const updated = await this.jobs.findJob(
      membership.householdId,
      documentId,
      jobId,
    );
    if (!updated) throw extractionNotFound();
    return mapExtractionJob(updated);
  }
}
