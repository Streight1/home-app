import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { BucketListItemService } from '../application/bucket-list-item.service.js';
import { BucketListLifecycleService } from '../application/bucket-list-lifecycle.service.js';
import {
  BucketListCompletionDto,
  SetBucketListDocumentsDto,
  SetBucketListParticipantsDto,
  SkipBucketListItemDto,
  UpdateBucketListItemDto,
} from './dto/bucket-list.dto.js';

@Controller('bucket-list-items')
export class BucketListItemsController {
  public constructor(
    private readonly items: BucketListItemService,
    private readonly lifecycle: BucketListLifecycleService,
  ) {}

  @Get(':itemId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    return this.items.detail(principal.userId, itemId);
  }

  @Patch(':itemId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() input: UpdateBucketListItemDto,
  ) {
    return this.items.update(principal.userId, itemId, input);
  }

  @Delete(':itemId')
  public remove(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    return this.items.remove(principal.userId, itemId);
  }

  @Post(':itemId/complete')
  public complete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() input: BucketListCompletionDto,
  ) {
    return this.lifecycle.complete(principal.userId, itemId, input);
  }

  @Post(':itemId/reopen')
  public reopen(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    return this.lifecycle.reopen(principal.userId, itemId);
  }

  @Post(':itemId/skip')
  public skip(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() input: SkipBucketListItemDto,
  ) {
    return this.lifecycle.skip(principal.userId, itemId, input);
  }

  @Post(':itemId/restore')
  public restore(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    return this.lifecycle.restore(principal.userId, itemId);
  }

  @Put(':itemId/participants')
  public setParticipants(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() input: SetBucketListParticipantsDto,
  ) {
    return this.items.update(principal.userId, itemId, input);
  }

  @Put(':itemId/documents')
  public setDocuments(
    @CurrentUser() principal: SessionPrincipal,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() input: SetBucketListDocumentsDto,
  ) {
    return this.items.update(principal.userId, itemId, input);
  }
}
