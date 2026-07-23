import type { Prisma } from '../../../generated/prisma/client.js';
import type {
  DocumentMetadataRecord,
  DocumentRecord,
} from '../domain/document.repository.js';

export const documentInclude = {
  file: true,
  folder: { select: { id: true, name: true } },
  trashedFromFolder: { select: { id: true, name: true } },
  createdBy: { select: { id: true, displayName: true, email: true } },
} satisfies Prisma.DocumentInclude;

export type PrismaDocumentRecord = Prisma.DocumentGetPayload<{
  include: typeof documentInclude;
}>;

function metadata(value: Prisma.JsonValue): DocumentMetadataRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return {};
  return value as DocumentMetadataRecord;
}

function origins(value: Prisma.JsonValue): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

export function toDocumentRecord(
  document: PrismaDocumentRecord,
): DocumentRecord {
  return {
    id: document.id,
    householdId: document.householdId,
    folderId: document.folderId,
    folder: document.folder,
    title: document.title,
    description: document.description,
    notes: document.notes,
    type: document.type,
    metadataJson: metadata(document.metadataJson),
    metadataSchemaVersion: document.metadataSchemaVersion,
    metadataOriginsJson: origins(document.metadataOriginsJson),
    status: document.status,
    documentDate: document.documentDate,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    archivedAt: document.archivedAt,
    trashedAt: document.trashedAt,
    trashedByUserId: document.trashedByUserId,
    trashedFromFolderId: document.trashedFromFolderId,
    trashedFromFolder: document.trashedFromFolder,
    createdBy: document.createdBy,
    file: document.file,
  };
}
