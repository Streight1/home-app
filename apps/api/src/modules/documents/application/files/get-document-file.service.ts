import type { Readable } from 'node:stream';
import { Inject, Injectable } from '@nestjs/common';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../../../infrastructure/storage/storage.port.js';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_READ_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import { documentNotFound } from '../../domain/document.errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRecord,
  type DocumentRepository,
} from '../../domain/document.repository.js';

export interface AccessibleDocumentFile {
  stream: Readable;
  mimeType: string;
  sizeBytes: number;
  filename: string;
}

@Injectable()
export class GetDocumentFileService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}
  public async execute(
    userId: string,
    documentId: string,
  ): Promise<{
    householdId: string;
    document: DocumentRecord;
    file: AccessibleDocumentFile;
  }> {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_READ_MINIMUM_ROLE,
    );
    const document = await this.documents.findById(
      membership.householdId,
      documentId,
    );
    if (!document?.file) throw documentNotFound();
    try {
      return {
        householdId: membership.householdId,
        document,
        file: {
          stream: await this.storage.read(document.file.storageKey),
          mimeType: document.file.detectedMimeType,
          sizeBytes: document.file.sizeBytes,
          filename: document.file.sanitizedFilename,
        },
      };
    } catch {
      throw documentNotFound();
    }
  }
}
