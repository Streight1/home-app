import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { MealsCatalogService } from '../application/meals-catalog.service.js';
import { MealsDashboardService } from '../application/meals-dashboard.service.js';
import { MealsFacade } from '../meals.facade.js';
import { MealsCalendarSummaryQueryDto } from './dto/planning.dto.js';
import { CreateCatalogCategoryDto } from './dto/shopping.dto.js';

@Controller()
export class MealsMetadataController {
  public constructor(
    private readonly catalog: MealsCatalogService,
    private readonly dashboardService: MealsDashboardService,
    private readonly facade: MealsFacade,
  ) {}

  @Get('meals/dashboard')
  public dashboard(@CurrentUser() principal: SessionPrincipal) {
    return this.dashboardService.get(principal.userId);
  }

  @Get('meals/calendar-summary')
  public calendarSummary(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: MealsCalendarSummaryQueryDto,
  ) {
    return this.facade.getCalendarSummary(
      principal.userId,
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('ingredients')
  public ingredients(
    @CurrentUser() principal: SessionPrincipal,
    @Query('query') query?: string,
  ) {
    return this.catalog.ingredients(principal.userId, query);
  }

  @Get('recipe-categories')
  public recipeCategories(@CurrentUser() principal: SessionPrincipal) {
    return this.catalog.recipeCategories(principal.userId);
  }

  @Post('recipe-categories')
  public createRecipeCategory(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateCatalogCategoryDto,
  ) {
    return this.catalog.createRecipeCategory(principal.userId, input);
  }

  @Post('recipe-categories/recommended')
  public recommendedRecipeCategories(
    @CurrentUser() principal: SessionPrincipal,
  ) {
    return this.catalog.recommended(principal.userId, 'recipe');
  }

  @Get('shopping-categories')
  public shoppingCategories(@CurrentUser() principal: SessionPrincipal) {
    return this.catalog.shoppingCategories(principal.userId);
  }

  @Post('shopping-categories')
  public createShoppingCategory(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateCatalogCategoryDto,
  ) {
    return this.catalog.createShoppingCategory(principal.userId, input);
  }

  @Post('shopping-categories/recommended')
  public recommendedShoppingCategories(
    @CurrentUser() principal: SessionPrincipal,
  ) {
    return this.catalog.recommended(principal.userId, 'shopping');
  }
}
