import { Injectable } from '@nestjs/common';
import { dateOnlyString } from '../../finance/domain/finance.types.js';
import { FinanceAnalyticsQueryDto } from '../presentation/dto/finance-analytics-query.dto.js';
import {
  groupByCurrency,
  isExpense,
  mapPeriod,
  percentChange,
  previousPeriod,
  resolvePeriod,
  signedExpense,
  sortAmount,
} from './finance-analytics.calculations.js';
import { FinanceAnalyticsQueryService } from './finance-analytics-query.service.js';
import {
  projectAnalyticsSummary,
  projectCategoryBreakdown,
  projectMonthlyTrend,
} from './finance-analytics.projectors.js';

@Injectable()
export class FinanceAnalyticsService {
  public constructor(private readonly queries: FinanceAnalyticsQueryService) {}

  public async summary(userId: string, query: FinanceAnalyticsQueryDto) {
    const period = resolvePeriod(query);
    const previous = previousPeriod(period);
    const { currentRows, previousRows } = await this.queries.loadComparison(
      userId,
      query,
      period,
      previous,
    );
    return projectAnalyticsSummary(period, previous, currentRows, previousRows);
  }

  public async categoryBreakdown(
    userId: string,
    query: FinanceAnalyticsQueryDto,
  ) {
    const period = resolvePeriod(query);
    const rows = await this.queries.load(userId, query, period);
    return projectCategoryBreakdown(period, rows);
  }

  public async monthlyTrend(userId: string, query: FinanceAnalyticsQueryDto) {
    const period = resolvePeriod(query);
    const rows = await this.queries.load(userId, query, period);
    return projectMonthlyTrend(period, rows);
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
    const period = resolvePeriod(query);
    const previousPeriodValue = previousPeriod(period);
    const { currentRows, previousRows } = await this.queries.loadComparison(
      userId,
      query,
      period,
      previousPeriodValue,
    );
    const current = projectCategoryBreakdown(period, currentRows);
    const previous = projectCategoryBreakdown(
      previousPeriodValue,
      previousRows,
    );
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
    const period = resolvePeriod(query);
    const previous = previousPeriod(period);
    const { currentRows, previousRows } = await this.queries.loadComparison(
      userId,
      query,
      period,
      previous,
    );
    const summary = projectAnalyticsSummary(
      period,
      previous,
      currentRows,
      previousRows,
    );
    const categories = projectCategoryBreakdown(period, currentRows);
    const trend = projectMonthlyTrend(period, currentRows);
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
