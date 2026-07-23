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
import { BudgetDashboardService } from '../application/budget-dashboard.service.js';
import { BudgetSummaryService } from '../application/budget-summary.service.js';
import { BudgetService } from '../application/budget.service.js';
import {
  CopyBudgetDto,
  CreateBudgetDto,
  ListBudgetsQueryDto,
  UpdateBudgetDto,
} from './dto/budget.dto.js';

@Controller('finance/budgets')
export class BudgetsController {
  public constructor(
    private readonly budgets: BudgetService,
    private readonly summaries: BudgetSummaryService,
    private readonly dashboard: BudgetDashboardService,
  ) {}

  @Get('dashboard')
  public getDashboard(@CurrentUser() principal: SessionPrincipal) {
    return this.dashboard.get(principal.userId);
  }

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListBudgetsQueryDto,
  ) {
    return this.budgets.list(principal.userId, query);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateBudgetDto,
  ) {
    return this.budgets.create(principal.userId, input);
  }

  @Get(':budgetId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('budgetId', new ParseUUIDPipe({ version: '4' })) budgetId: string,
  ) {
    return this.budgets.detail(principal.userId, budgetId);
  }

  @Patch(':budgetId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('budgetId', new ParseUUIDPipe({ version: '4' })) budgetId: string,
    @Body() input: UpdateBudgetDto,
  ) {
    return this.budgets.update(principal.userId, budgetId, input);
  }

  @Post(':budgetId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('budgetId', new ParseUUIDPipe({ version: '4' })) budgetId: string,
  ) {
    return this.budgets.archive(principal.userId, budgetId);
  }

  @Post(':budgetId/copy')
  public copy(
    @CurrentUser() principal: SessionPrincipal,
    @Param('budgetId', new ParseUUIDPipe({ version: '4' })) budgetId: string,
    @Body() input: CopyBudgetDto,
  ) {
    return this.budgets.copy(principal.userId, budgetId, input);
  }

  @Get(':budgetId/summary')
  public summary(
    @CurrentUser() principal: SessionPrincipal,
    @Param('budgetId', new ParseUUIDPipe({ version: '4' })) budgetId: string,
  ) {
    return this.summaries.get(principal.userId, budgetId);
  }
}
