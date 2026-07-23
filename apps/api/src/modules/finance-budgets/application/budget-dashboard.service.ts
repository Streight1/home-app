import { Injectable } from '@nestjs/common';
import { BudgetService } from './budget.service.js';
import { BudgetSummaryService } from './budget-summary.service.js';
import { SpendingInsightsService } from './spending-insights.service.js';
import { RecurringExpensesService } from './recurring-expenses.service.js';

@Injectable()
export class BudgetDashboardService {
  public constructor(
    private readonly budgets: BudgetService,
    private readonly summaries: BudgetSummaryService,
    private readonly insights: SpendingInsightsService,
    private readonly recurring: RecurringExpensesService,
  ) {}

  public async get(userId: string, now = new Date()) {
    const budgets = await this.budgets.list(userId, { status: 'ACTIVE' });
    const current = budgets.items.filter((budget) => {
      const today = now.toISOString().slice(0, 10);
      return budget.periodStart <= today && budget.periodEnd >= today;
    });
    const summaries = await Promise.all(
      current.map((budget) => this.summaries.get(userId, budget.id, now)),
    );
    const insights = await this.insights.list(userId, { status: 'NEW' });
    const candidates = await this.recurring.listCandidates(userId, {});
    return {
      budgets: summaries.map((summary) => ({
        id: summary.budget.id,
        name: summary.budget.name,
        currencyCode: summary.budget.currencyCode,
        spentMinor: summary.total.netSpentMinor,
        limitMinor: summary.total.limitMinor,
        usedPercent: summary.total.usedPercent,
        status: summary.total.status,
        mostUsedCategory: summary.allocations[0]
          ? {
              id: summary.allocations[0].category?.id ?? null,
              name: summary.allocations[0].category?.name ?? 'Bez limitu',
              usedPercent: summary.allocations[0].usedPercent,
            }
          : null,
      })),
      newInsightCount: insights.items.length,
      recurringCandidateCount: candidates.items.length,
      importantInsight: insights.items[0] ?? null,
    };
  }
}
