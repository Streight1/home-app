import type { DocumentRecord } from '../../domain/document.repository.js';
import type { DocumentStatus } from '../../domain/document-status.js';
import type { DocumentTypeKey } from '../../domain/metadata/document-type.js';
import type { DocumentMetadataRecord } from '../../domain/document.repository.js';

export interface DocumentResponse {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  type: DocumentTypeKey;
  metadata: DocumentMetadataRecord;
  metadataSchemaVersion: number;
  documentDate: string | null;
  folder: { id: string; name: string } | null;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  trashedAt: string | null;
  createdBy: {
    id: string;
    displayName: string | null;
  };
  file: {
    id: string;
    originalFilename: string;
    extension: string;
    mimeType: string;
    detectedMimeType: string;
    sizeBytes: number;
    createdAt: string;
  } | null;
}

export function mapDocumentResponse(
  document: DocumentRecord,
): DocumentResponse {
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    notes: document.notes,
    type: document.type,
    metadata: document.metadataJson,
    metadataSchemaVersion: document.metadataSchemaVersion,
    documentDate: document.documentDate?.toISOString().slice(0, 10) ?? null,
    folder: document.folder,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    archivedAt: document.archivedAt?.toISOString() ?? null,
    trashedAt: document.trashedAt?.toISOString() ?? null,
    createdBy: {
      id: document.createdBy.id,
      displayName: document.createdBy.displayName,
    },
    file: document.file
      ? {
          id: document.file.id,
          originalFilename: document.file.sanitizedFilename,
          extension: document.file.extension,
          mimeType: document.file.mimeType,
          detectedMimeType: document.file.detectedMimeType,
          sizeBytes: document.file.sizeBytes,
          createdAt: document.file.createdAt.toISOString(),
        }
      : null,
  };
}
