import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_MUTATION_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import {
  documentNotFound,
  invalidDocumentState,
} from '../../domain/document.errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/document.repository.js';
import {
  mapDocumentResponse,
  type DocumentResponse,
} from '../mappers/document-response.mapper.js';

@Injectable()
export class ArchiveDocumentService {
  public constructor(
    @Inject(HouseholdAccessService)
    private readonly householdAccess: HouseholdAccessService,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documents: DocumentRepository,
  ) {}

  public async execute(
    userId: string,
    documentId: string,
  ): Promise<DocumentResponse> {
    const membership = await this.householdAccess.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    const existing = await this.documents.findById(
      membership.householdId,
      documentId,
    );
    if (!existing) throw documentNotFound();
    if (existing.status === 'ARCHIVED') return mapDocumentResponse(existing);
    if (existing.status !== 'ACTIVE')
      throw invalidDocumentState('Dokument v koši nelze archivovat.');
    return mapDocumentResponse(
      await this.documents.setStatus({
        documentId,
        householdId: membership.householdId,
        userId,
        status: 'ARCHIVED',
        archivedAt: new Date(),
        action: 'DOCUMENT_ARCHIVED',
      }),
    );
  }
}
