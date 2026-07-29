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
import { MaintenanceCategoriesService } from '../application/maintenance-categories.service.js';
import {
  CreateMaintenanceCategoryDto,
  MaintenanceCategoriesQueryDto,
  UpdateMaintenanceCategoryDto,
} from './dto/maintenance.dto.js';

@Controller('maintenance/categories')
export class MaintenanceCategoriesController {
  public constructor(
    private readonly categories: MaintenanceCategoriesService,
  ) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: MaintenanceCategoriesQueryDto,
  ) {
    return this.categories.list(principal.userId, query.includeArchived);
  }

  @Post('recommended')
  public recommended(@CurrentUser() principal: SessionPrincipal) {
    return this.categories.createRecommended(principal.userId);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateMaintenanceCategoryDto,
  ) {
    return this.categories.create(principal.userId, input);
  }

  @Patch(':categoryId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
    @Body() input: UpdateMaintenanceCategoryDto,
  ) {
    return this.categories.update(principal.userId, categoryId, input);
  }

  @Post(':categoryId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
  ) {
    return this.categories.archive(principal.userId, categoryId);
  }
}
