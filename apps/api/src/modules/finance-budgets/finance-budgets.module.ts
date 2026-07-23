import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { FinanceAnalyticsModule } from '../finance-analytics/finance-analytics.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { BudgetDashboardService } from './application/budget-dashboard.service.js';
import { BudgetSummaryService } from './application/budget-summary.service.js';
import { BudgetService } from './application/budget.service.js';
import { RecurringExpensesService } from './application/recurring-expenses.service.js';
import { SpendingInsightsService } from './application/spending-insights.service.js';
import { PrismaBudgetRepository } from './infrastructure/prisma-budget.repository.js';
import { PrismaInsightRepository } from './infrastructure/prisma-insight.repository.js';
import { PrismaRecurringExpenseRepository } from './infrastructure/prisma-recurring-expense.repository.js';
import { BudgetsController } from './presentation/budgets.controller.js';
import { RecurringExpensesController } from './presentation/recurring-expenses.controller.js';
import { SpendingInsightsController } from './presentation/spending-insights.controller.js';

@Module({
  imports: [AuditModule, FinanceAnalyticsModule, HouseholdsModule],
  controllers: [
    BudgetsController,
    SpendingInsightsController,
    RecurringExpensesController,
  ],
  providers: [
    PrismaBudgetRepository,
    PrismaInsightRepository,
    PrismaRecurringExpenseRepository,
    BudgetService,
    BudgetSummaryService,
    RecurringExpensesService,
    SpendingInsightsService,
    BudgetDashboardService,
  ],
})
export class FinanceBudgetsModule {}
