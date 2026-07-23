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
import { FinanceCatalogService } from '../application/finance-catalog.service.js';
import {
  CreateFinancialCategoryDto,
  UpdateFinancialCategoryDto,
} from './dto/financial-category.dto.js';
import { FinanceCatalogQueryDto } from './dto/finance-catalog-query.dto.js';

@Controller('finance/categories')
export class FinancialCategoriesController {
  public constructor(private readonly catalog: FinanceCatalogService) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: FinanceCatalogQueryDto,
  ) {
    return this.catalog.listCategories(principal.userId, query.includeArchived);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateFinancialCategoryDto,
  ) {
    return this.catalog.createCategory(principal.userId, input);
  }

  @Post('recommended')
  public recommended(@CurrentUser() principal: SessionPrincipal) {
    return this.catalog.createRecommendedCategories(principal.userId);
  }

  @Patch(':categoryId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
    @Body() input: UpdateFinancialCategoryDto,
  ) {
    return this.catalog.updateCategory(principal.userId, categoryId, input);
  }

  @Post(':categoryId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
  ) {
    return this.catalog.archiveCategory(principal.userId, categoryId);
  }
}
