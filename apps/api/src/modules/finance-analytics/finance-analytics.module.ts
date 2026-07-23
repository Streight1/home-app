import { Module } from '@nestjs/common';
import { HouseholdsModule } from '../households/households.module.js';
import { FinanceAnalyticsService } from './application/finance-analytics.service.js';
import { FinanceAnalyticsQueryService } from './application/finance-analytics-query.service.js';
import { FinanceAnalyticsController } from './presentation/finance-analytics.controller.js';
import { FinanceAnalyticsFacade } from './public/finance-analytics.facade.js';

@Module({
  imports: [HouseholdsModule],
  controllers: [FinanceAnalyticsController],
  providers: [
    FinanceAnalyticsService,
    FinanceAnalyticsQueryService,
    FinanceAnalyticsFacade,
  ],
  exports: [FinanceAnalyticsService, FinanceAnalyticsFacade],
})
export class FinanceAnalyticsModule {}
