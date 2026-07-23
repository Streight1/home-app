import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../../../infrastructure/storage/storage.port.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRecord,
  type DocumentRepository,
} from '../../domain/document.repository.js';
import type { ValidatedDocumentFile } from '../document-file.validator.js';
import type { DocumentTypeKey } from '../../domain/metadata/document-type.js';
import type { DocumentMetadataRecord } from '../../domain/document.repository.js';

export interface AttachDocumentFileInput {
  documentId: string;
  householdId: string;
  userId: string;
  title: string;
  description: string | null;
  notes?: string | null;
  folderId?: string | null;
  type?: DocumentTypeKey;
  metadataJson?: DocumentMetadataRecord;
  metadataSchemaVersion?: number;
  documentDate?: Date | null;
  file: ValidatedDocumentFile;
}

@Injectable()
export class AttachDocumentFileService {
  private readonly logger = new Logger(AttachDocumentFileService.name);

  public constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documents: DocumentRepository,
  ) {}

  public async execute(
    input: AttachDocumentFileInput,
  ): Promise<DocumentRecord> {
    const stored = await this.storage.write(input.file.buffer, {
      directorySegments: ['documents', input.householdId, input.documentId],
    });
    try {
      return await this.documents.create({
        id: input.documentId,
        householdId: input.householdId,
        userId: input.userId,
        title: input.title,
        description: input.description,
        notes: input.notes ?? null,
        folderId: input.folderId ?? null,
        type: input.type ?? 'GENERAL',
        metadataJson: input.metadataJson ?? {},
        metadataSchemaVersion: input.metadataSchemaVersion ?? 1,
        documentDate: input.documentDate ?? null,
        file: {
          id: randomUUID(),
          storageKey: stored.storageKey,
          originalFilename: input.file.originalFilename,
          sanitizedFilename: input.file.sanitizedFilename,
          extension: input.file.extension,
          mimeType: input.file.mimeType,
          detectedMimeType: input.file.detectedMimeType,
          sizeBytes: input.file.sizeBytes,
          checksumSha256: input.file.checksumSha256,
          version: 1,
        },
      });
    } catch (error) {
      try {
        await this.storage.delete(stored.storageKey);
      } catch {
        this.logger.error({
          code: 'DOCUMENT_ORPHAN_CLEANUP_FAILED',
          documentId: input.documentId,
        });
      }
      throw error;
    }
  }
}
