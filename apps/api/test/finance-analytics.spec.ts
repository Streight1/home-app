import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import { FinanceAnalyticsService } from '../src/modules/finance-analytics/application/finance-analytics.service.js';
import { FinanceAnalyticsQueryService } from '../src/modules/finance-analytics/application/finance-analytics-query.service.js';
import { calculateAccountBalance } from '../src/modules/finance/domain/ledger-rules.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';

const rows = [
  {
    id: '1',
    type: 'EXPENSE',
    amountMinor: 10_000n,
    currencyCode: 'CZK',
    bookedDate: new Date('2026-07-05'),
    merchantNormalizedName: 'Alza',
    counterpartyName: 'ALZA',
    category: { id: 'cat', name: 'Elektronika' },
  },
  {
    id: '2',
    type: 'REFUND',
    amountMinor: 2_500n,
    currencyCode: 'CZK',
    bookedDate: new Date('2026-07-06'),
    merchantNormalizedName: 'Alza',
    counterpartyName: 'ALZA',
    category: { id: 'cat', name: 'Elektronika' },
  },
  {
    id: '3',
    type: 'EXPENSE',
    amountMinor: 3_000n,
    currencyCode: 'EUR',
    bookedDate: new Date('2026-07-07'),
    merchantNormalizedName: null,
    counterpartyName: null,
    category: null,
  },
  {
    id: '4',
    type: 'INCOME',
    amountMinor: 20_000n,
    currencyCode: 'CZK',
    bookedDate: new Date('2026-07-08'),
    merchantNormalizedName: null,
    counterpartyName: null,
    category: null,
  },
] as const;

function context() {
  const findMany = vi.fn().mockResolvedValue(rows);
  const prisma = {
    financialTransaction: { findMany },
  } as unknown as PrismaService;
  const access = {
    getActiveMembership: vi.fn().mockResolvedValue({
      householdId: '10000000-0000-4000-8000-000000000001',
    }),
  } as unknown as HouseholdAccessService;
  const queries = new FinanceAnalyticsQueryService(prisma, access);
  return { service: new FinanceAnalyticsService(queries), findMany };
}

describe('finance analytics ledger semantics', () => {
  it('excludes transfers in the scoped Prisma query and includes credit cards by default', async () => {
    const { service, findMany } = context();
    await service.summary('user', {
      includeCreditCards: true,
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: { in: ['EXPENSE', 'REFUND', 'INCOME'] },
        }),
      }),
    );
  });

  it('can exclude credit-card purchases without changing ledger semantics', async () => {
    const { service, findMany } = context();
    await service.summary('user', {
      includeCreditCards: false,
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          account: { type: { not: 'CREDIT_CARD' } },
        }),
      }),
    );
  });

  it('subtracts refunds from expenses instead of counting them as income', async () => {
    const result = await context().service.summary('user', {
      includeCreditCards: true,
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(
      result.currencies.find((item) => item.currencyCode === 'CZK'),
    ).toMatchObject({ incomeMinor: '20000', expenseMinor: '7500' });
  });

  it('never combines different currencies', async () => {
    const result = await context().service.categoryBreakdown('user', {
      includeCreditCards: true,
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(result.currencies.map((item) => item.currencyCode)).toEqual([
      'CZK',
      'EUR',
    ]);
  });

  it('keeps uncategorized spending visible', async () => {
    const result = await context().service.categoryBreakdown('user', {
      includeCreditCards: true,
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(
      result.currencies.find((item) => item.currencyCode === 'EUR')?.items[0],
    ).toMatchObject({
      categoryId: null,
      name: 'Nezařazeno',
      amountMinor: '3000',
    });
  });

  it('produces deterministic daily trend points', async () => {
    const result = await context().service.monthlyTrend('user', {
      includeCreditCards: true,
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(result).toMatchObject({ granularity: 'DAY' });
    expect(result.currencies[0]?.points.map((point) => point.period)).toEqual([
      '2026-07-05',
      '2026-07-06',
      '2026-07-08',
    ]);
  });

  it('keeps previous-period category comparison deterministic', async () => {
    const result = await context().service.categoryComparison('user', {
      includeCreditCards: true,
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(
      result.currencies.find((item) => item.currencyCode === 'CZK')?.items[0],
    ).toMatchObject({
      amountMinor: '7500',
      previousAmountMinor: '7500',
      differenceMinor: '0',
    });
  });

  it('treats a card refund as balance recovery', () => {
    expect(
      calculateAccountBalance(-20_000n, [
        { type: 'REFUND', amountMinor: 5_000n },
      ]),
    ).toBe(-15_000n);
  });
});
