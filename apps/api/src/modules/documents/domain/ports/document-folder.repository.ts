import type { DocumentFolderRecord } from '../folders/document-folder.js';

export const DOCUMENT_FOLDER_REPOSITORY = Symbol('DOCUMENT_FOLDER_REPOSITORY');

export interface DocumentFolderRepository {
  list(householdId: string): Promise<DocumentFolderRecord[]>;
  findById(
    householdId: string,
    folderId: string,
  ): Promise<DocumentFolderRecord | null>;
  findByNormalizedName(
    householdId: string,
    parentId: string | null,
    normalizedName: string,
  ): Promise<DocumentFolderRecord | null>;
  create(input: {
    id: string;
    householdId: string;
    parentId: string | null;
    name: string;
    normalizedName: string;
    userId: string;
  }): Promise<DocumentFolderRecord>;
  update(input: {
    folderId: string;
    householdId: string;
    parentId?: string | null;
    name?: string;
    normalizedName?: string;
    userId: string;
    action: 'DOCUMENT_FOLDER_RENAMED' | 'DOCUMENT_FOLDER_MOVED';
  }): Promise<DocumentFolderRecord>;
  countContents(
    householdId: string,
    folderId: string,
  ): Promise<{ children: number; documents: number }>;
  delete(householdId: string, folderId: string, userId: string): Promise<void>;
}
