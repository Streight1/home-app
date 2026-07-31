import {
  dateOnly,
  dateOnlyString,
} from '../../finance/domain/finance.types.js';
import { financeInvalid } from '../../finance/domain/finance.errors.js';
import type { FinanceAnalyticsQueryDto } from '../presentation/dto/finance-analytics-query.dto.js';
import type {
  AnalyticsPeriod,
  AnalyticsTransaction,
} from './finance-analytics-query.service.js';

export function resolvePeriod(
  query: Pick<FinanceAnalyticsQueryDto, 'dateFrom' | 'dateTo'>,
): AnalyticsPeriod {
  const now = new Date();
  const from = query.dateFrom
    ? dateOnly(query.dateFrom)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = query.dateTo
    ? dateOnly(query.dateTo)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  if (from > to)
    throw financeInvalid('Začátek období nesmí být po jeho konci.');
  return { from, to };
}

export function previousPeriod(period: AnalyticsPeriod): AnalyticsPeriod {
  const days = differenceInDays(period.from, period.to) + 1;
  const to = new Date(period.from);
  to.setUTCDate(to.getUTCDate() - 1);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days + 1);
  return { from, to };
}

export const mapPeriod = (period: AnalyticsPeriod) => ({
  dateFrom: dateOnlyString(period.from),
  dateTo: dateOnlyString(period.to),
});
export const differenceInDays = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / 86_400_000);
export const isExpense = (type: string) =>
  type === 'EXPENSE' || type === 'REFUND';
export const signedExpense = (row: { type: string; amountMinor: bigint }) =>
  row.type === 'REFUND' ? -row.amountMinor : row.amountMinor;
export function totals(
  rows: readonly AnalyticsTransaction[],
  currencyCode: string,
) {
  return rows
    .filter((row) => row.currencyCode === currencyCode)
    .reduce(
      (value, row) => {
        if (row.type === 'INCOME') value.income += row.amountMinor;
        if (isExpense(row.type)) value.expense += signedExpense(row);
        if (row.type === 'EXPENSE' && !row.category)
          value.uncategorizedCount += 1;
        return value;
      },
      { income: 0n, expense: 0n, uncategorizedCount: 0 },
    );
}
export const mergeCurrencyCodes = (
  ...groups: readonly (readonly AnalyticsTransaction[])[]
) =>
  [
    ...new Set(groups.flatMap((rows) => rows.map((row) => row.currencyCode))),
  ].sort();
export function groupByCurrency<T>(
  rows: readonly AnalyticsTransaction[],
  mapper: (rows: AnalyticsTransaction[], currency: string) => T,
): T[] {
  return mergeCurrencyCodes([...rows]).map((currency) =>
    mapper(
      rows.filter((row) => row.currencyCode === currency),
      currency,
    ),
  );
}
export const sortAmount = <T extends { amount: bigint }>(left: T, right: T) =>
  left.amount > right.amount ? -1 : left.amount < right.amount ? 1 : 0;
export const percentChange = (current: bigint, previous: bigint) =>
  previous === 0n
    ? null
    : Number(
        ((current - previous) * 10_000n) /
          (previous < 0n ? -previous : previous),
      );
export function periodFilter(key: string, daily: boolean) {
  if (daily) return { dateFrom: key, dateTo: key };
  const [yearValue, monthValue] = key.split('-').map(Number);
  const year = yearValue ?? 1970;
  const month = monthValue ?? 1;
  return {
    dateFrom: `${key}-01`,
    dateTo: dateOnlyString(new Date(Date.UTC(year, month, 0))),
  };
}
