import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { GearImagesService } from '../application/gear-images.service.js';
import { GearService } from '../application/gear.service.js';
import {
  CreateGearItemDto,
  GearImageFromUrlDto,
  GearImageSearchDto,
  ListGearQueryDto,
  ReplaceGearDocumentsDto,
  UpdateGearItemDto,
} from './dto/gear.dto.js';

@Controller('gear')
export class GearController {
  public constructor(
    private readonly gear: GearService,
    private readonly images: GearImagesService,
  ) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListGearQueryDto,
  ) {
    return this.gear.list(principal.userId, query);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateGearItemDto,
  ) {
    return this.gear.create(principal.userId, input);
  }

  @Post('image-search')
  public searchImages(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: GearImageSearchDto,
  ) {
    return this.images.search(principal.userId, input);
  }

  @Get(':gearItemId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('gearItemId', new ParseUUIDPipe({ version: '4' }))
    gearItemId: string,
  ) {
    return this.gear.detail(principal.userId, gearItemId);
  }

  @Patch(':gearItemId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('gearItemId', new ParseUUIDPipe({ version: '4' }))
    gearItemId: string,
    @Body() input: UpdateGearItemDto,
  ) {
    return this.gear.update(principal.userId, gearItemId, input);
  }

  @Post(':gearItemId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('gearItemId', new ParseUUIDPipe({ version: '4' }))
    gearItemId: string,
  ) {
    return this.gear.setArchived(principal.userId, gearItemId, true);
  }

  @Post(':gearItemId/restore')
  public restore(
    @CurrentUser() principal: SessionPrincipal,
    @Param('gearItemId', new ParseUUIDPipe({ version: '4' }))
    gearItemId: string,
  ) {
    return this.gear.setArchived(principal.userId, gearItemId, false);
  }

  @Put(':gearItemId/documents')
  public documents(
    @CurrentUser() principal: SessionPrincipal,
    @Param('gearItemId', new ParseUUIDPipe({ version: '4' }))
    gearItemId: string,
    @Body() input: ReplaceGearDocumentsDto,
  ) {
    return this.gear.replaceDocuments(
      principal.userId,
      gearItemId,
      input.documents,
    );
  }

  @Post(':gearItemId/image-from-url')
  public imageFromUrl(
    @CurrentUser() principal: SessionPrincipal,
    @Param('gearItemId', new ParseUUIDPipe({ version: '4' }))
    gearItemId: string,
    @Body() input: GearImageFromUrlDto,
  ) {
    return this.images.importFromUrl(principal.userId, gearItemId, input);
  }
}
