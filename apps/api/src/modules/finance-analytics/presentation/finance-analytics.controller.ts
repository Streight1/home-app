import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { FinanceAnalyticsService } from '../application/finance-analytics.service.js';
import { FinanceAnalyticsQueryDto } from './dto/finance-analytics-query.dto.js';

@Controller('finance/analytics')
export class FinanceAnalyticsController {
  public constructor(private readonly analytics: FinanceAnalyticsService) {}
  @Get('summary') public summary(
    @CurrentUser() user: SessionPrincipal,
    @Query() query: FinanceAnalyticsQueryDto,
  ) {
    return this.analytics.summary(user.userId, query);
  }
  @Get('category-breakdown') public categories(
    @CurrentUser() user: SessionPrincipal,
    @Query() query: FinanceAnalyticsQueryDto,
  ) {
    return this.analytics.categoryBreakdown(user.userId, query);
  }
  @Get('monthly-trend') public trend(
    @CurrentUser() user: SessionPrincipal,
    @Query() query: FinanceAnalyticsQueryDto,
  ) {
    return this.analytics.monthlyTrend(user.userId, query);
  }
  @Get('top-merchants') public merchants(
    @CurrentUser() user: SessionPrincipal,
    @Query() query: FinanceAnalyticsQueryDto,
  ) {
    return this.analytics.topMerchants(user.userId, query);
  }
  @Get('category-comparison') public comparison(
    @CurrentUser() user: SessionPrincipal,
    @Query() query: FinanceAnalyticsQueryDto,
  ) {
    return this.analytics.categoryComparison(user.userId, query);
  }
  @Get('dashboard') public dashboard(@CurrentUser() user: SessionPrincipal) {
    return this.analytics.dashboard(user.userId);
  }
}
