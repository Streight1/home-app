import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_READ_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import { folderNotFound } from '../../domain/folders/document-folder.errors.js';
import {
  DOCUMENT_FOLDER_REPOSITORY,
  type DocumentFolderRepository,
} from '../../domain/ports/document-folder.repository.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/document.repository.js';
import type { ListDocumentsQueryDto } from '../../presentation/dto/list-documents-query.dto.js';
import { descendantIds } from '../folders/folder-tree.js';
import { DocumentListPresentationService } from '../presentation/document-list-presentation.service.js';

export interface DocumentListResponse {
  items: ReturnType<DocumentListPresentationService['map']>[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

@Injectable()
export class ListDocumentsService {
  public constructor(
    private readonly householdAccess: HouseholdAccessService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_FOLDER_REPOSITORY)
    private readonly folders: DocumentFolderRepository,
    private readonly presentation: DocumentListPresentationService = new DocumentListPresentationService(),
  ) {}

  public async execute(
    userId: string,
    query: ListDocumentsQueryDto,
  ): Promise<DocumentListResponse> {
    const membership = await this.householdAccess.getActiveMembership(
      userId,
      DOCUMENT_READ_MINIMUM_ROLE,
    );
    let folderIds: string[] | undefined;
    let rootFolderOnly = false;
    if (query.folderId === 'root') rootFolderOnly = true;
    else if (query.folderId) {
      const allFolders = await this.folders.list(membership.householdId);
      if (!allFolders.some((folder) => folder.id === query.folderId))
        throw folderNotFound();
      folderIds = [
        query.folderId,
        ...(query.includeSubfolders
          ? descendantIds(allFolders, query.folderId)
          : []),
      ];
    }
    const result = await this.documents.list({
      householdId: membership.householdId,
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      ...(query.query?.trim() ? { query: query.query.trim() } : {}),
      ...(folderIds ? { folderIds } : {}),
      ...(rootFolderOnly ? { rootFolderOnly: true } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.createdFrom
        ? { createdFrom: new Date(`${query.createdFrom}T00:00:00.000Z`) }
        : {}),
      ...(query.createdTo
        ? { createdTo: new Date(`${query.createdTo}T23:59:59.999Z`) }
        : {}),
    });
    return {
      items: result.items.map((document) =>
        this.presentation.map(document, membership.role),
      ),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / query.pageSize),
      },
    };
  }
}
