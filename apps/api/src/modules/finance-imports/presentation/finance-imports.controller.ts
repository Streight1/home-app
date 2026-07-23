import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { CancelImportSessionService } from '../application/sessions/cancel-import-session.service.js';
import { CommitImportSessionService } from '../application/sessions/commit-import-session.service.js';
import { ConfigureImportSessionService } from '../application/sessions/configure-import-session.service.js';
import { CreateImportSessionService } from '../application/sessions/create-import-session.service.js';
import { GetImportSessionService } from '../application/sessions/get-import-session.service.js';
import { CommitImportDto } from './dto/commit-import.dto.js';
import { ConfigureImportFormatDto } from './dto/configure-import-format.dto.js';
import { ConfigureImportMappingDto } from './dto/configure-import-mapping.dto.js';
import { CreateImportSessionDto } from './dto/create-import-session.dto.js';
import {
  ImportPreviewQueryDto,
  ListImportHistoryQueryDto,
} from './dto/import-preview.dto.js';
import {
  BulkImportRowCategoryDto,
  UpdateImportRowDto,
} from './dto/update-import-row.dto.js';

@Controller('finance/imports')
export class FinanceImportsController {
  public constructor(
    private readonly createSession: CreateImportSessionService,
    private readonly configure: ConfigureImportSessionService,
    private readonly getSession: GetImportSessionService,
    private readonly commitSession: CommitImportSessionService,
    private readonly cancelSession: CancelImportSessionService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateImportSessionDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.createSession.execute(principal.userId, input, file);
  }

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListImportHistoryQueryDto,
  ) {
    return this.getSession.list(principal.userId, query.page, query.pageSize);
  }

  @Get(':importId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('importId', new ParseUUIDPipe({ version: '4' })) importId: string,
  ) {
    return this.getSession.detail(principal.userId, importId);
  }

  @Patch(':importId/format')
  public format(
    @CurrentUser() principal: SessionPrincipal,
    @Param('importId', new ParseUUIDPipe({ version: '4' })) importId: string,
    @Body() input: ConfigureImportFormatDto,
  ) {
    return this.configure.format(principal.userId, importId, input);
  }

  @Patch(':importId/mapping')
  public mapping(
    @CurrentUser() principal: SessionPrincipal,
    @Param('importId', new ParseUUIDPipe({ version: '4' })) importId: string,
    @Body() input: ConfigureImportMappingDto,
  ) {
    return this.configure.mapping(principal.userId, importId, input);
  }

  @Get(':importId/preview')
  public preview(
    @CurrentUser() principal: SessionPrincipal,
    @Param('importId', new ParseUUIDPipe({ version: '4' })) importId: string,
    @Query() query: ImportPreviewQueryDto,
  ) {
    return this.getSession.preview(principal.userId, importId, query);
  }

  @Patch(':importId/rows/:rowId')
  public updateRow(
    @CurrentUser() principal: SessionPrincipal,
    @Param('importId', new ParseUUIDPipe({ version: '4' })) importId: string,
    @Param('rowId', new ParseUUIDPipe({ version: '4' })) rowId: string,
    @Body() input: UpdateImportRowDto,
  ) {
    return this.getSession.updateRow(principal.userId, importId, rowId, input);
  }

  @Patch(':importId/rows')
  public bulkCategory(
    @CurrentUser() principal: SessionPrincipal,
    @Param('importId', new ParseUUIDPipe({ version: '4' })) importId: string,
    @Body() input: BulkImportRowCategoryDto,
  ) {
    return this.getSession.bulkCategory(
      principal.userId,
      importId,
      input.rowIds,
      input.categoryId,
    );
  }

  @Post(':importId/commit')
  public commit(
    @CurrentUser() principal: SessionPrincipal,
    @Param('importId', new ParseUUIDPipe({ version: '4' })) importId: string,
    @Body() input: CommitImportDto,
  ) {
    return this.commitSession.execute(principal.userId, importId, input);
  }

  @Post(':importId/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async cancel(
    @CurrentUser() principal: SessionPrincipal,
    @Param('importId', new ParseUUIDPipe({ version: '4' })) importId: string,
  ): Promise<void> {
    await this.cancelSession.execute(principal.userId, importId);
  }
}
