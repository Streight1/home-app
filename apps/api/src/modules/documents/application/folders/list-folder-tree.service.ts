import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_READ_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import {
  DOCUMENT_FOLDER_REPOSITORY,
  type DocumentFolderRepository,
} from '../../domain/ports/document-folder.repository.js';
import { buildFolderTree } from './folder-tree.js';

@Injectable()
export class ListFolderTreeService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(DOCUMENT_FOLDER_REPOSITORY)
    private readonly folders: DocumentFolderRepository,
  ) {}
  public async execute(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_READ_MINIMUM_ROLE,
    );
    return {
      items: buildFolderTree(await this.folders.list(membership.householdId)),
    };
  }
}
