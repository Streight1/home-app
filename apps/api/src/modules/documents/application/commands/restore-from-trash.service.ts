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
import { mapDocumentResponse } from '../mappers/document-response.mapper.js';

@Injectable()
export class RestoreFromTrashService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
  ) {}
  public async execute(userId: string, documentId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    const existing = await this.documents.findById(
      membership.householdId,
      documentId,
    );
    if (!existing) throw documentNotFound();
    if (existing.status !== 'TRASHED')
      throw invalidDocumentState('Obnovit z koše lze pouze dokument v koši.');
    return mapDocumentResponse(
      await this.documents.restoreFromTrash({
        documentId,
        householdId: membership.householdId,
        userId,
      }),
    );
  }
}
