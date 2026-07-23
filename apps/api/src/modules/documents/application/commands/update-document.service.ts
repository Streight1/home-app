import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { DOCUMENT_MUTATION_MINIMUM_ROLE } from '../../domain/document-access.policy.js';
import {
  documentNotFound,
  invalidDocumentInput,
} from '../../domain/document.errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/document.repository.js';
import type { UpdateDocumentDto } from '../../presentation/dto/update-document.dto.js';
import {
  mapDocumentResponse,
  type DocumentResponse,
} from '../mappers/document-response.mapper.js';
import { DocumentTypeRegistryService } from '../metadata/document-type-registry.service.js';
import { ValidateDocumentMetadataService } from '../metadata/validate-document-metadata.service.js';

@Injectable()
export class UpdateDocumentService {
  public constructor(
    private readonly householdAccess: HouseholdAccessService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly documentTypes: DocumentTypeRegistryService,
    private readonly metadataValidator: ValidateDocumentMetadataService,
  ) {}

  public async execute(
    userId: string,
    documentId: string,
    input: UpdateDocumentDto,
  ): Promise<DocumentResponse> {
    const membership = await this.householdAccess.getActiveMembership(
      userId,
      DOCUMENT_MUTATION_MINIMUM_ROLE,
    );
    const existing = await this.documents.findById(
      membership.householdId,
      documentId,
    );
    if (!existing) throw documentNotFound();
    const changedFields = Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key);
    if (changedFields.length === 0)
      throw invalidDocumentInput('Vyplňte alespoň jednu změnu.');
    const type = input.documentType ?? existing.type;
    const definition = this.documentTypes.get(type);
    if (!definition)
      throw invalidDocumentInput('Typ dokumentu není podporovaný.');
    const metadata =
      input.metadata === undefined && input.documentType === undefined
        ? undefined
        : this.metadataValidator.validate(
            type,
            definition.schemaVersion,
            input.metadata ?? existing.metadataJson,
          );
    const document = await this.documents.updateMetadata({
      documentId,
      householdId: membership.householdId,
      userId,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.documentType !== undefined ? { type: input.documentType } : {}),
      ...(metadata !== undefined
        ? {
            metadataJson: metadata,
            metadataSchemaVersion: definition.schemaVersion,
          }
        : {}),
      ...(input.documentDate !== undefined
        ? {
            documentDate: input.documentDate
              ? new Date(`${input.documentDate}T00:00:00.000Z`)
              : null,
          }
        : {}),
      changedFields,
    });
    return mapDocumentResponse(document);
  }
}
