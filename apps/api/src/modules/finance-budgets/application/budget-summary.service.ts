import { Injectable } from '@nestjs/common';
import { FinanceAnalyticsFacade } from '../../finance-analytics/public/finance-analytics.facade.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { FINANCE_READ_ROLE } from '../../finance/domain/finance-access.policy.js';
import { dateOnlyString } from '../../finance/domain/finance.types.js';
import {
  budgetHealth,
  forecastSpending,
  inclusiveDays,
  splitExpenseTotals,
  usedPercent,
} from '../domain/budget-calculations.js';
import { financeBudgetNotFound } from '../domain/finance-budget.errors.js';
import { PrismaBudgetRepository } from '../infrastructure/prisma-budget.repository.js';

@Injectable()
export class BudgetSummaryService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly budgets: PrismaBudgetRepository,
    private readonly analytics: FinanceAnalyticsFacade,
  ) {}

  public async get(userId: string, budgetId: string, now = new Date()) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    const budget = await this.budgets.find(membership.householdId, budgetId);
    if (!budget) throw financeBudgetNotFound();
    const rows = (
      await this.analytics.loadExpenseHistory(userId, {
        from: budget.periodStart,
        to: budget.periodEnd,
        currencyCode: budget.currencyCode as 'CZK' | 'EUR',
      })
    ).filter((row) => row.type === 'EXPENSE' || row.type === 'REFUND');
    const totalDays = inclusiveDays(budget.periodStart, budget.periodEnd);
    const daysElapsed =
      now < budget.periodStart
        ? 0
        : Math.min(totalDays, inclusiveDays(budget.periodStart, now));
    const totals = splitExpenseTotals(rows);
    const totalForecast = forecastSpending({
      netSpentMinor: totals.netSpentMinor,
      limitMinor: budget.totalLimitMinor,
      daysElapsed,
      totalDays,
      transactionCount: rows.length,
    });
    const allocations = budget.allocations.map((allocation) => {
      const categoryRows = rows.filter(
        (row) => row.category?.id === allocation.categoryId,
      );
      const categoryTotals = splitExpenseTotals(categoryRows);
      const forecast = forecastSpending({
        netSpentMinor: categoryTotals.netSpentMinor,
        limitMinor: allocation.limitMinor,
        daysElapsed,
        totalDays,
        transactionCount: categoryRows.length,
      });
      return summaryLine({
        id: allocation.id,
        category: allocation.category,
        limitMinor: allocation.limitMinor,
        warningThresholdPercent: allocation.warningThresholdPercent,
        totals: categoryTotals,
        forecast,
        daysElapsed,
        daysRemaining: totalDays - daysElapsed,
      });
    });
    const uncategorized = splitExpenseTotals(
      rows.filter((row) => !row.category),
    );
    return {
      budget: {
        id: budget.id,
        name: budget.name,
        currencyCode: budget.currencyCode,
        periodStart: dateOnlyString(budget.periodStart),
        periodEnd: dateOnlyString(budget.periodEnd),
        status: budget.status,
      },
      total: summaryLine({
        id: 'total',
        category: null,
        limitMinor: budget.totalLimitMinor,
        warningThresholdPercent: 80,
        totals,
        forecast: totalForecast,
        daysElapsed,
        daysRemaining: totalDays - daysElapsed,
      }),
      allocations: allocations.sort(healthOrder),
      uncategorized: {
        spentMinor: uncategorized.spentMinor.toString(),
        refundedMinor: uncategorized.refundedMinor.toString(),
        netSpentMinor: uncategorized.netSpentMinor.toString(),
      },
    };
  }
}

function summaryLine(input: {
  id: string;
  category: { id: string; name: string } | null;
  limitMinor: bigint | null;
  warningThresholdPercent: number;
  totals: ReturnType<typeof splitExpenseTotals>;
  forecast: ReturnType<typeof forecastSpending>;
  daysElapsed: number;
  daysRemaining: number;
}) {
  const remaining =
    input.limitMinor === null
      ? null
      : input.limitMinor - input.totals.netSpentMinor;
  const health = budgetHealth({
    netSpentMinor: input.totals.netSpentMinor,
    limitMinor: input.limitMinor,
    warningThresholdPercent: input.warningThresholdPercent,
    forecastMinor: input.forecast.amountMinor,
  });
  return {
    id: input.id,
    category: input.category,
    limitMinor: input.limitMinor?.toString() ?? null,
    spentMinor: input.totals.spentMinor.toString(),
    refundedMinor: input.totals.refundedMinor.toString(),
    netSpentMinor: input.totals.netSpentMinor.toString(),
    remainingMinor: remaining?.toString() ?? null,
    usedPercent: usedPercent(input.totals.netSpentMinor, input.limitMinor),
    daysElapsed: input.daysElapsed,
    daysRemaining: input.daysRemaining,
    forecast: {
      status: input.forecast.status,
      amountMinor: input.forecast.amountMinor?.toString() ?? null,
      percent: input.forecast.percent,
    },
    warningThresholdPercent: input.warningThresholdPercent,
    status: health,
  };
}

const ranks: Record<string, number> = {
  EXCEEDED: 0,
  FORECAST_EXCEEDED: 1,
  APPROACHING: 2,
  SAFE: 3,
  NO_LIMIT: 4,
};
const healthOrder = (left: { status: string }, right: { status: string }) =>
  (ranks[left.status] ?? 9) - (ranks[right.status] ?? 9);
