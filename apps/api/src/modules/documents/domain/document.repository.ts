import type { DocumentTypeKey } from './metadata/document-type.js';
import type {
  DocumentSortField,
  DocumentStatus,
  SortDirection,
} from './document-status.js';

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

export interface DocumentAuthorRecord {
  id: string;
  displayName: string | null;
  email: string;
}
export interface DocumentFolderSummary {
  id: string;
  name: string;
}
export interface DocumentFileRecord {
  id: string;
  storageKey: string;
  originalFilename: string;
  sanitizedFilename: string;
  extension: string;
  mimeType: string;
  detectedMimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  version: number;
  createdAt: Date;
}

export interface DocumentLineItem {
  description: string;
  quantity?: string;
  unit?: string;
  unitPriceMinor?: number;
  vatRate?: string;
  totalAmountMinor?: number;
}
export type DocumentMetadataValue =
  | string
  | number
  | boolean
  | DocumentLineItem[];
export type DocumentMetadataRecord = Record<string, DocumentMetadataValue>;

export interface DocumentRecord {
  id: string;
  householdId: string;
  folderId: string | null;
  folder: DocumentFolderSummary | null;
  title: string;
  description: string | null;
  notes: string | null;
  type: DocumentTypeKey;
  metadataJson: DocumentMetadataRecord;
  metadataSchemaVersion: number;
  metadataOriginsJson: Record<string, string>;
  status: DocumentStatus;
  documentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  trashedAt: Date | null;
  trashedByUserId: string | null;
  trashedFromFolderId: string | null;
  trashedFromFolder: DocumentFolderSummary | null;
  createdBy: DocumentAuthorRecord;
  file: DocumentFileRecord | null;
}

export interface CreateDocumentRecordInput {
  id: string;
  householdId: string;
  userId: string;
  folderId?: string | null;
  title: string;
  description: string | null;
  notes?: string | null;
  type?: DocumentTypeKey;
  metadataJson?: DocumentMetadataRecord;
  metadataSchemaVersion?: number;
  documentDate?: Date | null;
  file: Omit<
    DocumentFileRecord,
    | 'createdAt'
    | 'sanitizedFilename'
    | 'extension'
    | 'detectedMimeType'
    | 'version'
  > &
    Partial<
      Pick<
        DocumentFileRecord,
        'sanitizedFilename' | 'extension' | 'detectedMimeType' | 'version'
      >
    >;
}

export interface ListDocumentRecordsInput {
  householdId: string;
  page: number;
  pageSize: 10 | 20 | 50 | 100;
  query?: string;
  folderIds?: readonly string[];
  rootFolderOnly?: boolean;
  type?: DocumentTypeKey;
  status: DocumentStatus;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy: DocumentSortField;
  sortDirection: SortDirection;
}

export interface UpdateDocumentRecordInput {
  documentId: string;
  householdId: string;
  userId: string;
  title?: string;
  description?: string | null;
  notes?: string | null;
  type?: DocumentTypeKey;
  metadataJson?: DocumentMetadataRecord;
  metadataSchemaVersion?: number;
  documentDate?: Date | null;
  changedFields: readonly string[];
}

export interface SetDocumentStatusInput {
  documentId: string;
  householdId: string;
  userId: string;
  status: DocumentStatus;
  archivedAt: Date | null;
  action: 'DOCUMENT_ARCHIVED' | 'DOCUMENT_RESTORED';
}

export interface StoredFileDeletionTaskRecord {
  id: string;
  storageKey: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  attempts: number;
}

export interface DocumentRepository {
  create(input: CreateDocumentRecordInput): Promise<DocumentRecord>;
  list(
    input: ListDocumentRecordsInput,
  ): Promise<{ items: DocumentRecord[]; totalItems: number }>;
  findById(
    householdId: string,
    documentId: string,
  ): Promise<DocumentRecord | null>;
  findManyByIds(
    householdId: string,
    documentIds: readonly string[],
  ): Promise<DocumentRecord[]>;
  updateMetadata(input: UpdateDocumentRecordInput): Promise<DocumentRecord>;
  move(input: {
    documentId: string;
    householdId: string;
    folderId: string | null;
    userId: string;
  }): Promise<DocumentRecord>;
  applyExtractedMetadata(input: {
    documentId: string;
    householdId: string;
    userId: string;
    jobId: string;
    values: DocumentMetadataRecord;
  }): Promise<DocumentRecord>;
  setStatus(input: SetDocumentStatusInput): Promise<DocumentRecord>;
  moveToTrash(input: {
    documentId: string;
    householdId: string;
    userId: string;
  }): Promise<DocumentRecord>;
  restoreFromTrash(input: {
    documentId: string;
    householdId: string;
    userId: string;
  }): Promise<DocumentRecord>;
  permanentlyDelete(input: {
    documentId: string;
    householdId: string;
    userId: string;
  }): Promise<{ taskId: string }>;
  findDeletionTasks(
    limit: number,
    taskId?: string,
  ): Promise<StoredFileDeletionTaskRecord[]>;
  markDeletionTaskProcessing(taskId: string): Promise<void>;
  completeDeletionTask(taskId: string): Promise<void>;
  failDeletionTask(taskId: string, errorCode: string): Promise<void>;
  recordFileAccess(
    householdId: string,
    userId: string,
    documentId: string,
    file: Pick<DocumentFileRecord, 'mimeType' | 'sizeBytes'>,
    action: 'DOCUMENT_PREVIEWED' | 'DOCUMENT_DOWNLOADED',
  ): Promise<void>;
}
