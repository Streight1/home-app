import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { BucketListDashboardService } from '../application/bucket-list-dashboard.service.js';
import { BucketListItemService } from '../application/bucket-list-item.service.js';
import { BucketListRolloverService } from '../application/bucket-list-rollover.service.js';
import { BucketListService } from '../application/bucket-list.service.js';
import {
  BucketListYearQueryDto,
  CarryBucketListItemsDto,
  CreateBucketListDto,
  CreateBucketListItemDto,
  ListBucketListItemsQueryDto,
  ListBucketListsQueryDto,
  PrepareBucketListRolloverDto,
  UpdateBucketListDto,
} from './dto/bucket-list.dto.js';

@Controller('bucket-lists')
export class BucketListsController {
  public constructor(
    private readonly lists: BucketListService,
    private readonly items: BucketListItemService,
    private readonly rollover: BucketListRolloverService,
    private readonly dashboard: BucketListDashboardService,
  ) {}

  @Get('dashboard')
  public getDashboard(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: BucketListYearQueryDto,
  ) {
    return this.dashboard.get(principal.userId, query.year);
  }

  @Get('summary')
  public getSummary(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: BucketListYearQueryDto,
  ) {
    return this.dashboard.get(principal.userId, query.year);
  }

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListBucketListsQueryDto,
  ) {
    return this.lists.list(principal.userId, query);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateBucketListDto,
  ) {
    return this.lists.create(principal.userId, input);
  }

  @Get(':listId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
  ) {
    return this.lists.detail(principal.userId, listId);
  }

  @Patch(':listId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
    @Body() input: UpdateBucketListDto,
  ) {
    return this.lists.update(principal.userId, listId, input);
  }

  @Post(':listId/close')
  public close(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
  ) {
    return this.lists.setStatus(principal.userId, listId, 'CLOSED');
  }

  @Post(':listId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
  ) {
    return this.lists.setStatus(principal.userId, listId, 'ARCHIVED');
  }

  @Get(':listId/items')
  public listItems(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
    @Query() query: ListBucketListItemsQueryDto,
  ) {
    return this.items.list(principal.userId, listId, query);
  }

  @Post(':listId/items')
  public createItem(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
    @Body() input: CreateBucketListItemDto,
  ) {
    return this.items.create(principal.userId, listId, input);
  }

  @Post(':listId/rollover/prepare')
  public prepareRollover(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
    @Body() input: PrepareBucketListRolloverDto,
  ) {
    return this.rollover.prepare(principal.userId, listId, input);
  }

  @Post(':listId/rollover/carry')
  public carryRollover(
    @CurrentUser() principal: SessionPrincipal,
    @Param('listId', new ParseUUIDPipe({ version: '4' })) listId: string,
    @Body() input: CarryBucketListItemsDto,
  ) {
    return this.rollover.carry(principal.userId, listId, input);
  }
}
