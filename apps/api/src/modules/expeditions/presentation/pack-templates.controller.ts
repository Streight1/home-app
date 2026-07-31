import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { PackTemplatesService } from '../application/pack-templates.service.js';
import {
  CreatePackTemplateDto,
  ReplacePackTemplateItemsDto,
  UpdatePackTemplateDto,
  UpdateTemplateSnapshotsDto,
} from './dto/pack-template.dto.js';

@Controller('pack-templates')
export class PackTemplatesController {
  public constructor(private readonly templates: PackTemplatesService) {}

  @Get()
  public list(@CurrentUser() principal: SessionPrincipal) {
    return this.templates.list(principal.userId);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreatePackTemplateDto,
  ) {
    return this.templates.create(principal.userId, input);
  }

  @Get(':templateId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
  ) {
    return this.templates.detail(principal.userId, templateId);
  }

  @Patch(':templateId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
    @Body() input: UpdatePackTemplateDto,
  ) {
    return this.templates.update(principal.userId, templateId, input);
  }

  @Post(':templateId/duplicate')
  public duplicate(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
  ) {
    return this.templates.duplicate(principal.userId, templateId);
  }

  @Post(':templateId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
  ) {
    return this.templates.setArchived(principal.userId, templateId, true);
  }

  @Put(':templateId/items')
  public items(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
    @Body() input: ReplacePackTemplateItemsDto,
  ) {
    return this.templates.replaceItems(
      principal.userId,
      templateId,
      input.items,
    );
  }

  @Get(':templateId/catalog-update-preview')
  public catalogPreview(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
  ) {
    return this.templates.catalogUpdatePreview(principal.userId, templateId);
  }

  @Post(':templateId/catalog-update')
  public catalogUpdate(
    @CurrentUser() principal: SessionPrincipal,
    @Param('templateId', new ParseUUIDPipe({ version: '4' }))
    templateId: string,
    @Body() input: UpdateTemplateSnapshotsDto,
  ) {
    return this.templates.applyCatalogUpdate(
      principal.userId,
      templateId,
      input.confirmed,
    );
  }
}
