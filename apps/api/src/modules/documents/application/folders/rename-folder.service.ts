import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_MUTATION_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import {
  duplicateFolder,
  folderNotFound,
  invalidFolder,
} from '../../domain/folders/document-folder.errors.js';
import { normalizeFolderName } from '../../domain/folders/document-folder.js';
import {
  DOCUMENT_FOLDER_REPOSITORY,
  type DocumentFolderRepository,
} from '../../domain/ports/document-folder.repository.js';

@Injectable()
export class RenameFolderService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(DOCUMENT_FOLDER_REPOSITORY)
    private readonly folders: DocumentFolderRepository,
  ) {}
  public async execute(userId: string, folderId: string, name: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    const folder = await this.folders.findById(
      membership.householdId,
      folderId,
    );
    if (!folder) throw folderNotFound();
    const normalizedName = normalizeFolderName(name);
    if (!normalizedName || name.trim().length > 100)
      throw invalidFolder('Název složky musí mít 1 až 100 znaků.');
    const duplicate = await this.folders.findByNormalizedName(
      membership.householdId,
      folder.parentId,
      normalizedName,
    );
    if (duplicate && duplicate.id !== folderId) throw duplicateFolder();
    return this.folders.update({
      folderId,
      householdId: membership.householdId,
      name: name.trim().replace(/\s+/g, ' '),
      normalizedName,
      userId,
      action: 'DOCUMENT_FOLDER_RENAMED',
    });
  }
}
