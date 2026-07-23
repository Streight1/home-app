import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/document.repository.js';
import {
  contentDisposition,
  previewUnsupported,
} from './document-file-response.js';
import { GetDocumentFileService } from './get-document-file.service.js';
import type { DocumentFileStream } from './download-document-file.service.js';

const previewMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
]);

@Injectable()
export class PreviewDocumentFileService {
  private readonly logger = new Logger(PreviewDocumentFileService.name);
  public constructor(
    private readonly files: GetDocumentFileService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
  ) {}
  public async execute(
    userId: string,
    documentId: string,
  ): Promise<DocumentFileStream> {
    const source = await this.files.execute(userId, documentId);
    if (!previewMimeTypes.has(source.file.mimeType)) throw previewUnsupported();
    void this.documents
      .recordFileAccess(
        source.householdId,
        userId,
        documentId,
        source.file,
        'DOCUMENT_PREVIEWED',
      )
      .catch(() =>
        this.logger.warn({ code: 'DOCUMENT_PREVIEW_AUDIT_FAILED', documentId }),
      );
    return {
      ...source.file,
      disposition: contentDisposition(source.file.filename, true),
    };
  }
}
