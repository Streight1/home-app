export type DocumentStatus = 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
export type HouseholdRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type DocumentTypeKey =
  | 'GENERAL'
  | 'INVOICE'
  | 'RECEIPT'
  | 'CONTRACT'
  | 'WARRANTY'
  | 'INSURANCE'
  | 'MANUAL'
  | 'VEHICLE_DOCUMENT'
  | 'PROPERTY_DOCUMENT'
  | 'UTILITY_BILL'
  | 'PERSONAL'
  | 'OTHER';
export interface DocumentLineItem {
  description: string;
  quantity?: string;
  unit?: string;
  unitPriceMinor?: number;
  vatRate?: string;
  totalAmountMinor?: number;
}
export type MetadataValue = string | number | boolean | DocumentLineItem[];
export type DocumentMetadata = Record<string, MetadataValue>;

export interface DocumentFile {
  id: string;
  originalFilename: string;
  extension: string;
  mimeType: string;
  detectedMimeType: string;
  sizeBytes: number;
  createdAt: string;
}
export interface DocumentFolderSummary {
  id: string;
  name: string;
}
export interface DocumentItem {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  type: DocumentTypeKey;
  metadata: DocumentMetadata;
  metadataSchemaVersion: number;
  documentDate: string | null;
  folder: DocumentFolderSummary | null;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  trashedAt: string | null;
  createdBy: { id: string; displayName: string | null };
  file: DocumentFile | null;
}
export interface DocumentListItem {
  id: string;
  type: DocumentTypeKey;
  title: string;
  folder: DocumentFolderSummary | null;
  status: DocumentStatus;
  trashedAt: string | null;
  presentation: {
    primaryLabel: string;
    secondaryLabel: string | null;
    referenceLabel: string | null;
    documentDate: string | null;
    amount: { minorUnits: number; currencyCode: string } | null;
  };
  canPreview: boolean;
  permissions: {
    canEdit: boolean;
    canArchive: boolean;
    canRestoreArchive: boolean;
    canMove: boolean;
    canMoveToTrash: boolean;
    canRestoreFromTrash: boolean;
    canPermanentlyDelete: boolean;
  };
  file: {
    id: string;
    originalFilename: string;
    extension: string;
    mimeType: string;
  } | null;
}
export interface DocumentListResponse {
  items: DocumentListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
export type DocumentPageSize = 10 | 20 | 50 | 100;
export type DocumentSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'documentDate'
  | 'fileSize';
export interface DocumentListQuery {
  page?: number | undefined;
  pageSize?: DocumentPageSize | undefined;
  query?: string | undefined;
  folderId?: string | undefined;
  includeSubfolders?: boolean | undefined;
  type?: DocumentTypeKey | undefined;
  status?: DocumentStatus | undefined;
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
  sortBy?: DocumentSortField | undefined;
  sortDirection?: 'asc' | 'desc' | undefined;
}
export interface CreateDocumentInput {
  title: string;
  description?: string;
  notes?: string;
  documentType: DocumentTypeKey;
  folderId?: string;
  metadata: DocumentMetadata;
  documentDate?: string;
  file: File;
}
export interface UpdateDocumentInput {
  title?: string;
  description?: string | null;
  notes?: string | null;
  documentType?: DocumentTypeKey;
  metadata?: DocumentMetadata;
  documentDate?: string | null;
}

export interface DocumentFolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children: DocumentFolderNode[];
}
export interface DocumentTypeField {
  key: string;
  label: string;
  type:
    | 'STRING'
    | 'DATE'
    | 'INTEGER'
    | 'MONEY_MINOR'
    | 'CURRENCY'
    | 'BOOLEAN'
    | 'DECIMAL'
    | 'ENUM'
    | 'LINE_ITEMS';
  required: boolean;
  maxLength?: number;
  searchable: boolean;
  filterable: boolean;
  options?: readonly string[];
}
export interface DocumentTypeDefinition {
  key: DocumentTypeKey;
  label: string;
  description: string;
  schemaVersion: number;
  fields: readonly DocumentTypeField[];
}
