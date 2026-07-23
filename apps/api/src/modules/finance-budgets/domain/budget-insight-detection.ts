import type { InsightDraft } from '../infrastructure/prisma-insight.repository.js';
import { createInsightDraft } from './spending-insight-detection.js';

interface BudgetSummaryLine {
  category: { id: string; name: string } | null;
  netSpentMinor: string;
  limitMinor: string | null;
  usedPercent: number | null;
  status: string;
  forecast: { amountMinor: string | null };
}

interface BudgetInsightSummary {
  budget: {
    id: string;
    name: string;
    periodStart: string;
    periodEnd: string;
    currencyCode: string;
    status?: string;
  };
  total: BudgetSummaryLine;
  allocations: BudgetSummaryLine[];
  uncategorized?: unknown;
}

export function budgetInsightDrafts(
  summary: BudgetInsightSummary,
): InsightDraft[] {
  const period = {
    periodStart: new Date(`${summary.budget.periodStart}T00:00:00.000Z`),
    periodEnd: new Date(`${summary.budget.periodEnd}T00:00:00.000Z`),
    currencyCode: summary.budget.currencyCode,
  };
  return [summary.total, ...summary.allocations].flatMap((line) => {
    const label = line.category?.name ?? summary.budget.name;
    const common = {
      kind: 'budget',
      budgetId: summary.budget.id,
      ...(line.category ? { categoryId: line.category.id } : {}),
      netSpentMinor: line.netSpentMinor,
      limitMinor: line.limitMinor,
      usedPercent: line.usedPercent,
    };
    if (line.status === 'EXCEEDED')
      return [
        createInsightDraft(
          'BUDGET_EXCEEDED',
          'IMPORTANT',
          `${label}: limit je překročený`,
          'Čisté výdaje po započtení refundací překročily nastavený limit.',
          period,
          common,
        ),
      ];
    if (line.status === 'FORECAST_EXCEEDED')
      return [
        createInsightDraft(
          'BUDGET_FORECAST_EXCEEDED',
          'WARNING',
          `${label}: odhad směřuje nad limit`,
          'Při současném tempu může být limit do konce období překročen. Jde o orientační odhad.',
          period,
          { ...common, forecastMinor: line.forecast.amountMinor },
        ),
      ];
    if (line.status === 'APPROACHING')
      return [
        createInsightDraft(
          'BUDGET_THRESHOLD_REACHED',
          'WARNING',
          `${label}: blížíte se limitu`,
          'Čerpání dosáhlo nastaveného varovného prahu rozpočtu.',
          period,
          common,
        ),
      ];
    return [];
  });
}
