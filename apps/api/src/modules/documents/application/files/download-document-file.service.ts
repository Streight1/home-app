import type { Readable } from 'node:stream';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/document.repository.js';
import { contentDisposition } from './document-file-response.js';
import { GetDocumentFileService } from './get-document-file.service.js';

export interface DocumentFileStream {
  stream: Readable;
  mimeType: string;
  sizeBytes: number;
  disposition: string;
}

@Injectable()
export class DownloadDocumentFileService {
  private readonly logger = new Logger(DownloadDocumentFileService.name);
  public constructor(
    private readonly files: GetDocumentFileService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
  ) {}
  public async execute(
    userId: string,
    documentId: string,
  ): Promise<DocumentFileStream> {
    const source = await this.files.execute(userId, documentId);
    void this.documents
      .recordFileAccess(
        source.householdId,
        userId,
        documentId,
        source.file,
        'DOCUMENT_DOWNLOADED',
      )
      .catch(() =>
        this.logger.warn({
          code: 'DOCUMENT_DOWNLOAD_AUDIT_FAILED',
          documentId,
        }),
      );
    return {
      ...source.file,
      disposition: contentDisposition(source.file.filename, false),
    };
  }
}
