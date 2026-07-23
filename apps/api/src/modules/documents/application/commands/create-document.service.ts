import { randomUUID } from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApiException } from '../../../../common/errors/api-exception.js';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_MUTATION_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import { folderNotFound } from '../../domain/folders/document-folder.errors.js';
import {
  DOCUMENT_FOLDER_REPOSITORY,
  type DocumentFolderRepository,
} from '../../domain/ports/document-folder.repository.js';
import type { CreateDocumentDto } from '../../presentation/dto/create-document.dto.js';
import type { DocumentResponse } from '../mappers/document-response.mapper.js';
import { mapDocumentResponse } from '../mappers/document-response.mapper.js';
import { DocumentFileValidator } from '../document-file.validator.js';
import { DocumentTypeRegistryService } from '../metadata/document-type-registry.service.js';
import { ValidateDocumentMetadataService } from '../metadata/validate-document-metadata.service.js';
import { AttachDocumentFileService } from './attach-document-file.service.js';

interface UploadedDocumentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class CreateDocumentService {
  public constructor(
    @Inject(HouseholdAccessService)
    private readonly householdAccess: HouseholdAccessService,
    @Inject(DocumentFileValidator)
    private readonly fileValidator: DocumentFileValidator,
    @Inject(AttachDocumentFileService)
    private readonly attachFile: AttachDocumentFileService,
    @Inject(DOCUMENT_FOLDER_REPOSITORY)
    private readonly folders: DocumentFolderRepository,
    @Inject(DocumentTypeRegistryService)
    private readonly documentTypes: DocumentTypeRegistryService,
    @Inject(ValidateDocumentMetadataService)
    private readonly metadataValidator: ValidateDocumentMetadataService,
  ) {}

  public async execute(
    userId: string,
    input: CreateDocumentDto,
    uploadedFile: UploadedDocumentFile | undefined,
  ): Promise<DocumentResponse> {
    const membership = await this.householdAccess.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    if (!uploadedFile) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'DOCUMENT_FILE_REQUIRED',
        'Vyberte právě jeden soubor.',
      );
    }
    if (
      input.folderId &&
      !(await this.folders.findById(membership.householdId, input.folderId))
    )
      throw folderNotFound();
    const definition = this.documentTypes.get(input.documentType);
    if (!definition)
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'DOCUMENT_INVALID_INPUT',
        'Typ dokumentu není podporovaný.',
      );
    const metadata = this.metadataValidator.validate(
      input.documentType,
      definition.schemaVersion,
      input.metadata,
    );
    const file = await this.fileValidator.validate(uploadedFile);
    const document = await this.attachFile.execute({
      documentId: randomUUID(),
      householdId: membership.householdId,
      userId,
      title: input.title,
      description: input.description ?? null,
      notes: input.notes ?? null,
      folderId: input.folderId ?? null,
      type: input.documentType,
      metadataJson: metadata,
      metadataSchemaVersion: definition.schemaVersion,
      documentDate: input.documentDate
        ? new Date(`${input.documentDate}T00:00:00.000Z`)
        : null,
      file,
    });
    return mapDocumentResponse(document);
  }
}
