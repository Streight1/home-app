import { dateOnlyString } from '../../finance/domain/finance.types.js';
import {
  differenceInDays,
  groupByCurrency,
  isExpense,
  mapPeriod,
  mergeCurrencyCodes,
  percentChange,
  periodFilter,
  signedExpense,
  sortAmount,
  totals,
} from './finance-analytics.calculations.js';
import type {
  AnalyticsPeriod,
  AnalyticsTransaction,
} from './finance-analytics-query.service.js';

export function projectAnalyticsSummary(
  period: AnalyticsPeriod,
  previousPeriod: AnalyticsPeriod,
  currentRows: readonly AnalyticsTransaction[],
  previousRows: readonly AnalyticsTransaction[],
) {
  return {
    period: mapPeriod(period),
    previousPeriod: mapPeriod(previousPeriod),
    currencies: mergeCurrencyCodes(currentRows, previousRows).map(
      (currencyCode) => {
        const current = totals(currentRows, currencyCode);
        const previous = totals(previousRows, currencyCode);
        return {
          currencyCode,
          incomeMinor: current.income.toString(),
          expenseMinor: current.expense.toString(),
          netMinor: (current.income - current.expense).toString(),
          previousExpenseMinor: previous.expense.toString(),
          expenseChangeMinor: (current.expense - previous.expense).toString(),
          expenseChangeBasisPoints: percentChange(
            current.expense,
            previous.expense,
          ),
          uncategorizedCount: current.uncategorizedCount,
        };
      },
    ),
  };
}

export function projectCategoryBreakdown(
  period: AnalyticsPeriod,
  rows: readonly AnalyticsTransaction[],
) {
  return {
    period: mapPeriod(period),
    currencies: groupByCurrency(rows, (currencyRows, currencyCode) => {
      const aggregate = new Map<
        string,
        {
          categoryId: string | null;
          name: string;
          amount: bigint;
          count: number;
        }
      >();
      for (const row of currencyRows) {
        if (!isExpense(row.type)) continue;
        const key = row.category?.id ?? 'uncategorized';
        const item = aggregate.get(key) ?? {
          categoryId: row.category?.id ?? null,
          name: row.category?.name ?? 'Nezařazeno',
          amount: 0n,
          count: 0,
        };
        item.amount += signedExpense(row);
        item.count += 1;
        aggregate.set(key, item);
      }
      const expenseTotal = totals(currencyRows, currencyCode).expense;
      return {
        currencyCode,
        items: [...aggregate.values()]
          .filter((item) => item.amount !== 0n)
          .sort(sortAmount)
          .map((item) => ({
            categoryId: item.categoryId,
            name: item.name,
            amountMinor: item.amount.toString(),
            transactionCount: item.count,
            shareBasisPoints:
              expenseTotal > 0n
                ? Number((item.amount * 10_000n) / expenseTotal)
                : 0,
            navigationTarget: {
              area: 'finance',
              screen: 'transactions',
              filters: {
                categoryId: item.categoryId,
                dateFrom: dateOnlyString(period.from),
                dateTo: dateOnlyString(period.to),
              },
            },
          })),
      };
    }),
  };
}

export function projectMonthlyTrend(
  period: AnalyticsPeriod,
  rows: readonly AnalyticsTransaction[],
) {
  const daily = differenceInDays(period.from, period.to) <= 92;
  return {
    period: mapPeriod(period),
    granularity: daily ? ('DAY' as const) : ('MONTH' as const),
    currencies: groupByCurrency(rows, (currencyRows, currencyCode) => {
      const points = new Map<string, { income: bigint; expense: bigint }>();
      for (const row of currencyRows) {
        const date = dateOnlyString(row.bookedDate);
        const key = daily ? date : date.slice(0, 7);
        const point = points.get(key) ?? { income: 0n, expense: 0n };
        if (row.type === 'INCOME') point.income += row.amountMinor;
        if (isExpense(row.type)) point.expense += signedExpense(row);
        points.set(key, point);
      }
      return {
        currencyCode,
        points: [...points.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([periodKey, point]) => ({
            period: periodKey,
            incomeMinor: point.income.toString(),
            expenseMinor: point.expense.toString(),
            netMinor: (point.income - point.expense).toString(),
            navigationTarget: {
              area: 'finance',
              screen: 'transactions',
              filters: periodFilter(periodKey, daily),
            },
          })),
      };
    }),
  };
}
