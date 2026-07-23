import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  documentNotFound,
  invalidDocumentState,
} from '../../domain/document.errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/document.repository.js';
import { StoredFileDeletionWorker } from '../files/stored-file-deletion.worker.js';

@Injectable()
export class PermanentlyDeleteDocumentService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly deletionWorker: StoredFileDeletionWorker,
  ) {}
  public async execute(userId: string, documentId: string): Promise<void> {
    const membership = await this.access.getActiveMembership(userId, 'ADMIN');
    const existing = await this.documents.findById(
      membership.householdId,
      documentId,
    );
    if (!existing) throw documentNotFound();
    if (existing.status !== 'TRASHED')
      throw invalidDocumentState('Trvale odstranit lze pouze dokument v koši.');
    const task = await this.documents.permanentlyDelete({
      documentId,
      householdId: membership.householdId,
      userId,
    });
    this.deletionWorker.enqueue(task.taskId);
  }
}
