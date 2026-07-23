import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_MUTATION_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import {
  folderNotFound,
  invalidFolder,
} from '../../domain/folders/document-folder.errors.js';
import {
  DOCUMENT_FOLDER_REPOSITORY,
  type DocumentFolderRepository,
} from '../../domain/ports/document-folder.repository.js';

@Injectable()
export class DeleteFolderService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(DOCUMENT_FOLDER_REPOSITORY)
    private readonly folders: DocumentFolderRepository,
  ) {}
  public async execute(userId: string, folderId: string): Promise<void> {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    if (!(await this.folders.findById(membership.householdId, folderId)))
      throw folderNotFound();
    const contents = await this.folders.countContents(
      membership.householdId,
      folderId,
    );
    if (contents.children > 0 || contents.documents > 0)
      throw invalidFolder(
        'Neprázdnou složku nelze odstranit. Nejprve přesuňte její obsah.',
      );
    await this.folders.delete(membership.householdId, folderId, userId);
  }
}
