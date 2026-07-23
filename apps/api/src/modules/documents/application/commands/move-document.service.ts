import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_MUTATION_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import { folderNotFound } from '../../domain/folders/document-folder.errors.js';
import {
  DOCUMENT_FOLDER_REPOSITORY,
  type DocumentFolderRepository,
} from '../../domain/ports/document-folder.repository.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/document.repository.js';
import { mapDocumentResponse } from '../mappers/document-response.mapper.js';

@Injectable()
export class MoveDocumentService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_FOLDER_REPOSITORY)
    private readonly folders: DocumentFolderRepository,
  ) {}
  public async execute(
    userId: string,
    documentId: string,
    folderId: string | null,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    if (
      folderId &&
      !(await this.folders.findById(membership.householdId, folderId))
    )
      throw folderNotFound();
    return mapDocumentResponse(
      await this.documents.move({
        documentId,
        householdId: membership.householdId,
        folderId,
        userId,
      }),
    );
  }
}
