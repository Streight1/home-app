import { Inject, Injectable } from '@nestjs/common';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../infrastructure/storage/storage.port.js';
import { HouseholdAccessService } from '../households/household-access.service.js';
import {
  DOCUMENT_MUTATION_MINIMUM_ROLE,
  DOCUMENT_READ_MINIMUM_ROLE,
} from './domain/document-access.policy.js';
import { documentNotFound } from './domain/document.errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentMetadataRecord,
  type DocumentRepository,
} from './domain/document.repository.js';
import { mapDocumentResponse } from './application/mappers/document-response.mapper.js';
import { ValidateDocumentMetadataService } from './application/metadata/validate-document-metadata.service.js';
import { DocumentListPresentationService } from './application/presentation/document-list-presentation.service.js';
import { CreateDocumentService } from './application/commands/create-document.service.js';
import { randomUUID } from 'node:crypto';

export interface SafeDocumentSummary {
  id: string;
  type: string;
  primaryLabel: string;
  canPreview: boolean;
}

@Injectable()
export class DocumentsFacade {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly metadataValidator: ValidateDocumentMetadataService,
    private readonly presentation: DocumentListPresentationService,
    private readonly createDocument: CreateDocumentService,
  ) {}

  public async createImportedImage(input: {
    userId: string;
    title: string;
    buffer: Buffer;
    mimeType: 'image/jpeg' | 'image/png';
    extension: 'jpg' | 'png';
  }): Promise<SafeDocumentSummary> {
    const filename = `${randomUUID()}.${input.extension}`;
    const document = await this.createDocument.execute(
      input.userId,
      {
        title: input.title,
        documentType: 'GENERAL',
        metadata: {},
      },
      {
        originalname: filename,
        mimetype: input.mimeType,
        size: input.buffer.length,
        buffer: input.buffer,
      },
    );
    return {
      id: document.id,
      type: document.type,
      primaryLabel: document.title,
      canPreview: Boolean(
        document.file &&
        ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'].includes(
          document.file.detectedMimeType,
        ),
      ),
    };
  }

  public async getSafeSummary(userId: string, documentId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_READ_MINIMUM_ROLE,
    );
    const document = await this.documents.findById(
      membership.householdId,
      documentId,
    );
    if (!document) throw documentNotFound();
    return mapDocumentResponse(document);
  }

  public async verifyMany(userId: string, documentIds: readonly string[]) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_READ_MINIMUM_ROLE,
    );
    return (
      await this.documents.findManyByIds(membership.householdId, documentIds)
    ).map(mapDocumentResponse);
  }

  public async verifyAccessibleSummaries(
    userId: string,
    documentIds: readonly string[],
  ): Promise<SafeDocumentSummary[]> {
    const uniqueIds = [...new Set(documentIds)];
    if (uniqueIds.length === 0) return [];
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_READ_MINIMUM_ROLE,
    );
    const records = await this.documents.findManyByIds(
      membership.householdId,
      uniqueIds,
    );
    if (records.length !== uniqueIds.length) throw documentNotFound();
    const byId = new Map(records.map((record) => [record.id, record]));
    return uniqueIds.map((id) => {
      const document = byId.get(id);
      if (!document) throw documentNotFound();
      const mapped = this.presentation.map(document, membership.role);
      return {
        id: mapped.id,
        type: mapped.type,
        primaryLabel: mapped.presentation.primaryLabel,
        canPreview: mapped.canPreview,
      };
    });
  }

  public async getExtractionSource(userId: string, documentId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    const document = await this.documents.findById(
      membership.householdId,
      documentId,
    );
    if (!document?.file) throw documentNotFound();
    return {
      householdId: membership.householdId,
      documentId,
      documentFileId: document.file.id,
      documentType: document.type,
      schemaVersion: document.metadataSchemaVersion,
      currentMetadata: document.metadataJson,
      mimeType: document.file.detectedMimeType,
      stream: await this.storage.read(document.file.storageKey),
    };
  }

  public async getExtractionDescriptor(userId: string, documentId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    const document = await this.documents.findById(
      membership.householdId,
      documentId,
    );
    if (!document?.file) throw documentNotFound();
    return {
      householdId: membership.householdId,
      documentId,
      documentFileId: document.file.id,
      documentType: document.type,
      schemaVersion: document.metadataSchemaVersion,
      mimeType: document.file.detectedMimeType,
    };
  }

  public async applyExtractionFields(
    userId: string,
    documentId: string,
    jobId: string,
    values: DocumentMetadataRecord,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    const document = await this.documents.findById(
      membership.householdId,
      documentId,
    );
    if (!document) throw documentNotFound();
    const merged = this.metadataValidator.validate(
      document.type,
      document.metadataSchemaVersion,
      { ...document.metadataJson, ...values },
    );
    return mapDocumentResponse(
      await this.documents.applyExtractedMetadata({
        documentId,
        householdId: membership.householdId,
        userId,
        jobId,
        values: Object.fromEntries(
          Object.keys(values).map((key) => [key, merged[key]]),
        ) as DocumentMetadataRecord,
      }),
    );
  }
}
