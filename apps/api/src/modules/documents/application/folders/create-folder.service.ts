import { randomUUID } from 'node:crypto';
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
import { folderDepth, maximumFolderDepth } from './folder-tree.js';

@Injectable()
export class CreateFolderService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(DOCUMENT_FOLDER_REPOSITORY)
    private readonly folders: DocumentFolderRepository,
  ) {}

  public async execute(userId: string, name: string, parentId: string | null) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    const normalizedName = normalizeFolderName(name);
    if (!normalizedName || name.trim().length > 100)
      throw invalidFolder('Název složky musí mít 1 až 100 znaků.');
    const all = await this.folders.list(membership.householdId);
    if (parentId && !all.some((folder) => folder.id === parentId))
      throw folderNotFound();
    if (folderDepth(all, parentId) + 1 > maximumFolderDepth)
      throw invalidFolder('Složka by překročila maximální hloubku 10.');
    if (
      await this.folders.findByNormalizedName(
        membership.householdId,
        parentId,
        normalizedName,
      )
    )
      throw duplicateFolder();
    return this.folders.create({
      id: randomUUID(),
      householdId: membership.householdId,
      parentId,
      name: name.trim().replace(/\s+/g, ' '),
      normalizedName,
      userId,
    });
  }
}
