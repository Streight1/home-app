import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_READ_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import { documentNotFound } from '../../domain/document.errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/document.repository.js';
import {
  mapDocumentResponse,
  type DocumentResponse,
} from '../mappers/document-response.mapper.js';

@Injectable()
export class GetDocumentDetailService {
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
      DOCUMENT_READ_MINIMUM_ROLE,
    );
    const document = await this.documents.findById(
      membership.householdId,
      documentId,
    );
    if (!document) throw documentNotFound();
    return mapDocumentResponse(document);
  }
}
