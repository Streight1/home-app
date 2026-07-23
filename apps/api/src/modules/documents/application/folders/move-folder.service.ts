import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_MUTATION_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import {
  duplicateFolder,
  folderNotFound,
  invalidFolder,
} from '../../domain/folders/document-folder.errors.js';
import {
  DOCUMENT_FOLDER_REPOSITORY,
  type DocumentFolderRepository,
} from '../../domain/ports/document-folder.repository.js';
import {
  descendantIds,
  folderDepth,
  maximumFolderDepth,
} from './folder-tree.js';

@Injectable()
export class MoveFolderService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(DOCUMENT_FOLDER_REPOSITORY)
    private readonly folders: DocumentFolderRepository,
  ) {}
  public async execute(
    userId: string,
    folderId: string,
    parentId: string | null,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    const all = await this.folders.list(membership.householdId);
    const folder = all.find((item) => item.id === folderId);
    if (!folder || (parentId && !all.some((item) => item.id === parentId)))
      throw folderNotFound();
    const descendants = descendantIds(all, folderId);
    if (parentId === folderId || (parentId && descendants.has(parentId)))
      throw invalidFolder(
        'Složku nelze přesunout do sebe ani vlastního potomka.',
      );
    const subtreeDepth = Math.max(
      1,
      ...[...descendants].map(
        (id) => folderDepth(all, id) - folderDepth(all, folderId) + 1,
      ),
    );
    if (folderDepth(all, parentId) + subtreeDepth > maximumFolderDepth)
      throw invalidFolder('Přesun by překročil maximální hloubku 10.');
    const duplicate = await this.folders.findByNormalizedName(
      membership.householdId,
      parentId,
      folder.normalizedName,
    );
    if (duplicate && duplicate.id !== folderId) throw duplicateFolder();
    return this.folders.update({
      folderId,
      householdId: membership.householdId,
      parentId,
      userId,
      action: 'DOCUMENT_FOLDER_MOVED',
    });
  }
}
