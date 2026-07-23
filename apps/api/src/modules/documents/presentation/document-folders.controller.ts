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
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { CreateFolderService } from '../application/folders/create-folder.service.js';
import { DeleteFolderService } from '../application/folders/delete-folder.service.js';
import { ListFolderTreeService } from '../application/folders/list-folder-tree.service.js';
import { MoveFolderService } from '../application/folders/move-folder.service.js';
import { RenameFolderService } from '../application/folders/rename-folder.service.js';
import {
  CreateFolderDto,
  MoveFolderDto,
  RenameFolderDto,
} from './dto/document-folder.dto.js';

@Controller('document-folders')
export class DocumentFoldersController {
  public constructor(
    @Inject(CreateFolderService)
    private readonly createFolder: CreateFolderService,
    @Inject(RenameFolderService)
    private readonly renameFolder: RenameFolderService,
    @Inject(MoveFolderService) private readonly moveFolder: MoveFolderService,
    @Inject(DeleteFolderService)
    private readonly deleteFolder: DeleteFolderService,
    @Inject(ListFolderTreeService)
    private readonly listFolders: ListFolderTreeService,
  ) {}

  @Get() public list(@CurrentUser() principal: SessionPrincipal) {
    return this.listFolders.execute(principal.userId);
  }
  @Post() public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateFolderDto,
  ) {
    return this.createFolder.execute(
      principal.userId,
      input.name,
      input.parentId ?? null,
    );
  }
  @Patch(':folderId') public rename(
    @CurrentUser() principal: SessionPrincipal,
    @Param('folderId', new ParseUUIDPipe({ version: '4' })) folderId: string,
    @Body() input: RenameFolderDto,
  ) {
    return this.renameFolder.execute(principal.userId, folderId, input.name);
  }
  @Post(':folderId/move') public move(
    @CurrentUser() principal: SessionPrincipal,
    @Param('folderId', new ParseUUIDPipe({ version: '4' })) folderId: string,
    @Body() input: MoveFolderDto,
  ) {
    return this.moveFolder.execute(
      principal.userId,
      folderId,
      input.parentId ?? null,
    );
  }
  @Delete(':folderId') @HttpCode(HttpStatus.NO_CONTENT) public async remove(
    @CurrentUser() principal: SessionPrincipal,
    @Param('folderId', new ParseUUIDPipe({ version: '4' })) folderId: string,
  ): Promise<void> {
    await this.deleteFolder.execute(principal.userId, folderId);
  }
}
