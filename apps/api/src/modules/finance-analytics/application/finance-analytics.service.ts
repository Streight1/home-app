import { Injectable } from '@nestjs/common';
import { dateOnlyString } from '../../finance/domain/finance.types.js';
import { FinanceAnalyticsQueryDto } from '../presentation/dto/finance-analytics-query.dto.js';
import {
  differenceInDays,
  groupByCurrency,
  isExpense,
  mapPeriod,
  mergeCurrencyCodes,
  percentChange,
  periodFilter,
  previousPeriod,
  resolvePeriod,
  signedExpense,
  sortAmount,
  totals,
} from './finance-analytics.calculations.js';
import { FinanceAnalyticsQueryService } from './finance-analytics-query.service.js';

@Injectable()
export class FinanceAnalyticsService {
  public constructor(private readonly queries: FinanceAnalyticsQueryService) {}

  public async summary(userId: string, query: FinanceAnalyticsQueryDto) {
    const period = resolvePeriod(query);
    const previous = previousPeriod(period);
    const [currentRows, previousRows] = await Promise.all([
      this.queries.load(userId, query, period),
      this.queries.load(userId, query, previous),
    ]);
    return {
      period: mapPeriod(period),
      previousPeriod: mapPeriod(previous),
      currencies: mergeCurrencyCodes(currentRows, previousRows).map(
        (currencyCode) => {
          const current = totals(currentRows, currencyCode);
          const prior = totals(previousRows, currencyCode);
          return {
            currencyCode,
            incomeMinor: current.income.toString(),
            expenseMinor: current.expense.toString(),
            netMinor: (current.income - current.expense).toString(),
            previousExpenseMinor: prior.expense.toString(),
            expenseChangeMinor: (current.expense - prior.expense).toString(),
            expenseChangeBasisPoints: percentChange(
              current.expense,
              prior.expense,
            ),
            uncategorizedCount: current.uncategorizedCount,
          };
        },
      ),
    };
  }

  public async categoryBreakdown(
    userId: string,
    query: FinanceAnalyticsQueryDto,
  ) {
    const period = resolvePeriod(query);
    const rows = await this.queries.load(userId, query, period);
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

  public async monthlyTrend(userId: string, query: FinanceAnalyticsQueryDto) {
    const period = resolvePeriod(query);
    const rows = await this.queries.load(userId, query, period);
    const daily = differenceInDays(period.from, period.to) <= 92;
    return {
      period: mapPeriod(period),
      granularity: daily ? 'DAY' : 'MONTH',
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

  public async topMerchants(userId: string, query: FinanceAnalyticsQueryDto) {
    const period = resolvePeriod(query);
    const rows = await this.queries.load(userId, query, period);
    return {
      period: mapPeriod(period),
      currencies: groupByCurrency(rows, (currencyRows, currencyCode) => {
        const merchants = new Map<
          string,
          { name: string; amount: bigint; count: number }
        >();
        for (const row of currencyRows) {
          if (!isExpense(row.type)) continue;
          const name =
            row.merchantNormalizedName ??
            row.counterpartyName?.trim() ??
            'Neznámý obchodník';
          const key = name.toLocaleLowerCase('cs-CZ');
          const item = merchants.get(key) ?? { name, amount: 0n, count: 0 };
          item.amount += signedExpense(row);
          item.count += 1;
          merchants.set(key, item);
        }
        return {
          currencyCode,
          items: [...merchants.values()]
            .filter((item) => item.amount > 0n)
            .sort(sortAmount)
            .slice(0, 15)
            .map((item) => ({
              merchant: item.name,
              amountMinor: item.amount.toString(),
              transactionCount: item.count,
              navigationTarget: {
                area: 'finance',
                screen: 'transactions',
                filters: {
                  query: item.name,
                  dateFrom: dateOnlyString(period.from),
                  dateTo: dateOnlyString(period.to),
                },
              },
            })),
        };
      }),
    };
  }

  public async categoryComparison(
    userId: string,
    query: FinanceAnalyticsQueryDto,
  ) {
    const current = await this.categoryBreakdown(userId, query);
    const previousQuery = Object.assign(
      new FinanceAnalyticsQueryDto(),
      query,
      mapPeriod(previousPeriod(resolvePeriod(query))),
    );
    const previous = await this.categoryBreakdown(userId, previousQuery);
    return {
      period: current.period,
      currencies: current.currencies.map((currency) => {
        const prior = previous.currencies.find(
          (item) => item.currencyCode === currency.currencyCode,
        );
        return {
          currencyCode: currency.currencyCode,
          items: currency.items.map((item) => {
            const previousItem = prior?.items.find(
              (candidate) => candidate.categoryId === item.categoryId,
            );
            const currentAmount = BigInt(item.amountMinor);
            const previousAmount = BigInt(previousItem?.amountMinor ?? '0');
            return {
              ...item,
              previousAmountMinor: previousAmount.toString(),
              differenceMinor: (currentAmount - previousAmount).toString(),
              changeBasisPoints: percentChange(currentAmount, previousAmount),
            };
          }),
        };
      }),
    };
  }

  public async dashboard(userId: string) {
    const query = new (class extends Object {})() as FinanceAnalyticsQueryDto;
    query.includeCreditCards = true;
    const [summary, categories, trend] = await Promise.all([
      this.summary(userId, query),
      this.categoryBreakdown(userId, query),
      this.monthlyTrend(userId, query),
    ]);
    return {
      period: summary.period,
      currencies: summary.currencies.map((currency) => ({
        ...currency,
        topCategory:
          categories.currencies.find(
            (item) => item.currencyCode === currency.currencyCode,
          )?.items[0] ?? null,
        trend:
          trend.currencies.find(
            (item) => item.currencyCode === currency.currencyCode,
          )?.points ?? [],
      })),
      navigationTarget: { area: 'finance', screen: 'analytics' },
    };
  }
}
