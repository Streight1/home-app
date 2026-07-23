import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { DownloadDocumentFileService } from '../application/files/download-document-file.service.js';
import { PreviewDocumentFileService } from '../application/files/preview-document-file.service.js';
import type { DocumentFileStream } from '../application/files/download-document-file.service.js';

@Controller('documents')
export class DocumentFilesController {
  public constructor(
    @Inject(DownloadDocumentFileService)
    private readonly downloadFile: DownloadDocumentFileService,
    @Inject(PreviewDocumentFileService)
    private readonly previewFile: PreviewDocumentFileService,
  ) {}

  @Get(':documentId/file/preview')
  public async preview(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    return this.stream(
      await this.previewFile.execute(principal.userId, documentId),
      response,
    );
  }

  @Get(':documentId/file/download')
  public async download(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    return this.stream(
      await this.downloadFile.execute(principal.userId, documentId),
      response,
    );
  }

  @Get(':documentId/file')
  public async legacyDownload(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    return this.stream(
      await this.downloadFile.execute(principal.userId, documentId),
      response,
    );
  }

  private stream(file: DocumentFileStream, response: Response): StreamableFile {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(file.stream, {
      type: file.mimeType,
      length: file.sizeBytes,
      disposition: file.disposition,
    });
  }
}
