import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { ArchiveDocumentService } from '../application/commands/archive-document.service.js';
import { CreateDocumentService } from '../application/commands/create-document.service.js';
import { RestoreDocumentService } from '../application/commands/restore-document.service.js';
import { UpdateDocumentService } from '../application/commands/update-document.service.js';
import { MoveDocumentService } from '../application/commands/move-document.service.js';
import { TrashDocumentService } from '../application/commands/trash-document.service.js';
import { RestoreFromTrashService } from '../application/commands/restore-from-trash.service.js';
import { PermanentlyDeleteDocumentService } from '../application/commands/permanently-delete-document.service.js';
import type { DocumentResponse } from '../application/mappers/document-response.mapper.js';
import { GetDocumentDetailService } from '../application/queries/get-document-detail.service.js';
import {
  ListDocumentsService,
  type DocumentListResponse,
} from '../application/queries/list-documents.service.js';
import { CreateDocumentDto } from './dto/create-document.dto.js';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto.js';
import { UpdateDocumentDto } from './dto/update-document.dto.js';
import { MoveDocumentDto } from './dto/document-folder.dto.js';

@Controller('documents')
export class DocumentsController {
  public constructor(
    @Inject(CreateDocumentService)
    private readonly createDocument: CreateDocumentService,
    @Inject(ListDocumentsService)
    private readonly listDocuments: ListDocumentsService,
    @Inject(GetDocumentDetailService)
    private readonly getDocument: GetDocumentDetailService,
    @Inject(UpdateDocumentService)
    private readonly updateDocument: UpdateDocumentService,
    @Inject(ArchiveDocumentService)
    private readonly archiveDocument: ArchiveDocumentService,
    @Inject(RestoreDocumentService)
    private readonly restoreDocument: RestoreDocumentService,
    @Inject(MoveDocumentService)
    private readonly moveDocument: MoveDocumentService,
    private readonly trashDocument: TrashDocumentService,
    private readonly restoreFromTrash: RestoreFromTrashService,
    private readonly permanentlyDelete: PermanentlyDeleteDocumentService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<DocumentResponse> {
    return this.createDocument.execute(principal.userId, input, file);
  }

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListDocumentsQueryDto,
  ): Promise<DocumentListResponse> {
    return this.listDocuments.execute(principal.userId, query);
  }

  @Get('trash')
  public listTrash(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListDocumentsQueryDto,
  ): Promise<DocumentListResponse> {
    query.status = 'TRASHED';
    return this.listDocuments.execute(principal.userId, query);
  }

  @Get(':documentId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ): Promise<DocumentResponse> {
    return this.getDocument.execute(principal.userId, documentId);
  }

  @Patch(':documentId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
    @Body() input: UpdateDocumentDto,
  ): Promise<DocumentResponse> {
    return this.updateDocument.execute(principal.userId, documentId, input);
  }

  @Post(':documentId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ): Promise<DocumentResponse> {
    return this.archiveDocument.execute(principal.userId, documentId);
  }

  @Post(':documentId/restore')
  public restore(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ): Promise<DocumentResponse> {
    return this.restoreDocument.execute(principal.userId, documentId);
  }

  @Post(':documentId/move')
  public move(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
    @Body() input: MoveDocumentDto,
  ): Promise<DocumentResponse> {
    return this.moveDocument.execute(
      principal.userId,
      documentId,
      input.folderId ?? null,
    );
  }

  @Post(':documentId/trash')
  public trash(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ): Promise<DocumentResponse> {
    return this.trashDocument.execute(principal.userId, documentId);
  }

  @Post(':documentId/restore-from-trash')
  public restoreTrash(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ): Promise<DocumentResponse> {
    return this.restoreFromTrash.execute(principal.userId, documentId);
  }

  @Delete(':documentId/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async permanent(
    @CurrentUser() principal: SessionPrincipal,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ): Promise<void> {
    await this.permanentlyDelete.execute(principal.userId, documentId);
  }
}
