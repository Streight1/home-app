import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import {
  budgetHealth,
  forecastSpending,
  splitExpenseTotals,
  usedPercent,
} from '../src/modules/finance-budgets/domain/budget-calculations.js';
import { detectRecurringPattern } from '../src/modules/finance-budgets/domain/recurring-detection.js';
import { BudgetService } from '../src/modules/finance-budgets/application/budget.service.js';
import { BudgetSummaryService } from '../src/modules/finance-budgets/application/budget-summary.service.js';
import {
  budgetInsightDrafts,
  detectInsights,
} from '../src/modules/finance-budgets/application/spending-insights.service.js';
import type { FinanceAnalyticsFacade } from '../src/modules/finance-analytics/public/finance-analytics.facade.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import type { PrismaBudgetRepository } from '../src/modules/finance-budgets/infrastructure/prisma-budget.repository.js';
import { PrismaInsightRepository } from '../src/modules/finance-budgets/infrastructure/prisma-insight.repository.js';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import type { AuditService } from '../src/modules/audit/audit.service.js';
import type { FinancialTransactionType } from '../src/generated/prisma/client.js';

describe('finance budget money semantics', () => {
  it('subtracts refunds and never treats them as income', () => {
    expect(
      splitExpenseTotals([
        { type: 'EXPENSE', amountMinor: 10_000n },
        { type: 'REFUND', amountMinor: 2_500n },
        { type: 'TRANSFER_OUT', amountMinor: 50_000n },
      ]),
    ).toEqual({
      spentMinor: 10_000n,
      refundedMinor: 2_500n,
      netSpentMinor: 7_500n,
    });
  });

  it('calculates percentages with bigint beyond safe JavaScript integers', () => {
    expect(usedPercent(9_007_199_254_740_993n, 18_014_398_509_481_986n)).toBe(
      50,
    );
  });

  it('does not forecast before five days or three transactions', () => {
    expect(
      forecastSpending({
        netSpentMinor: 100_000n,
        limitMinor: 1_000_000n,
        daysElapsed: 4,
        totalDays: 31,
        transactionCount: 10,
      }),
    ).toEqual({ status: 'NOT_ENOUGH_DATA', amountMinor: null, percent: null });
  });

  it('uses elapsed days for a deterministic integer forecast', () => {
    expect(
      forecastSpending({
        netSpentMinor: 500_000n,
        limitMinor: 2_000_000n,
        daysElapsed: 10,
        totalDays: 30,
        transactionCount: 3,
      }),
    ).toMatchObject({
      status: 'AVAILABLE',
      amountMinor: 1_500_000n,
      percent: 75,
    });
  });

  it('distinguishes warning, forecast and actual exceed states', () => {
    expect(
      budgetHealth({
        netSpentMinor: 800n,
        limitMinor: 1_000n,
        warningThresholdPercent: 80,
        forecastMinor: null,
      }),
    ).toBe('APPROACHING');
    expect(
      budgetHealth({
        netSpentMinor: 700n,
        limitMinor: 1_000n,
        warningThresholdPercent: 80,
        forecastMinor: 1_100n,
      }),
    ).toBe('FORECAST_EXCEEDED');
    expect(
      budgetHealth({
        netSpentMinor: 1_001n,
        limitMinor: 1_000n,
        warningThresholdPercent: 80,
        forecastMinor: null,
      }),
    ).toBe('EXCEEDED');
  });
});

describe('recurring payment detection', () => {
  it('requires at least three occurrences', () => {
    expect(
      detectRecurringPattern([
        { bookedDate: new Date('2026-01-01'), amountMinor: 100n },
      ]),
    ).toBeNull();
  });

  it('detects a monthly pattern and produces the next date', () => {
    const result = detectRecurringPattern([
      { bookedDate: new Date('2026-01-15'), amountMinor: 20_000n },
      { bookedDate: new Date('2026-02-15'), amountMinor: 20_100n },
      { bookedDate: new Date('2026-03-15'), amountMinor: 20_000n },
    ]);
    expect(result).toMatchObject({
      frequency: 'MONTHLY',
      typicalAmountMinor: 20_000n,
      evidenceTransactionCount: 3,
    });
    expect(result?.nextExpectedDate.toISOString().slice(0, 10)).toBe(
      '2026-04-15',
    );
  });

  it('rejects irregular intervals instead of inventing recurrence', () => {
    expect(
      detectRecurringPattern([
        { bookedDate: new Date('2026-01-01'), amountMinor: 100n },
        { bookedDate: new Date('2026-01-16'), amountMinor: 100n },
        { bookedDate: new Date('2026-03-15'), amountMinor: 100n },
      ]),
    ).toBeNull();
  });

  it('rejects a regular interval when amounts are not similar', () => {
    expect(
      detectRecurringPattern([
        { bookedDate: new Date('2026-01-15'), amountMinor: 10_000n },
        { bookedDate: new Date('2026-02-15'), amountMinor: 50_000n },
        { bookedDate: new Date('2026-03-15'), amountMinor: 10_000n },
      ]),
    ).toBeNull();
  });
});

describe('budget household boundary', () => {
  it('passes only the server-derived household to persistence', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const repository = {
      listCategories: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue('budget-id'),
      find: vi.fn().mockResolvedValue({
        id: 'budget-id',
        name: 'Červenec',
        currencyCode: 'CZK',
        periodType: 'MONTHLY',
        periodStart: new Date('2026-07-01'),
        periodEnd: new Date('2026-07-31'),
        totalLimitMinor: 100_000n,
        status: 'DRAFT',
        archivedAt: null,
        allocations: [],
      }),
    } as unknown as PrismaBudgetRepository;
    const service = new BudgetService(access, repository);
    await service.create('user-id', {
      name: 'Červenec',
      currencyCode: 'CZK',
      periodType: 'MONTHLY',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      totalLimitMinor: '100000',
      status: 'DRAFT',
      allocations: [],
    });
    expect(repository.create).toHaveBeenCalledWith(
      'household-a',
      'user-id',
      expect.any(Object),
    );
  });

  it('rejects a monthly range that is not the whole calendar month', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a' }),
    } as unknown as HouseholdAccessService;
    const repository = {
      listCategories: vi.fn(),
    } as unknown as PrismaBudgetRepository;
    const service = new BudgetService(access, repository);
    await expect(
      service.create('user-id', {
        name: 'Část měsíce',
        currencyCode: 'CZK',
        periodType: 'MONTHLY',
        periodStart: '2026-07-02',
        periodEnd: '2026-07-31',
        status: 'DRAFT',
        allocations: [],
      }),
    ).rejects.toMatchObject({ code: 'FINANCE_INVALID_INPUT' });
  });

  it('requires MEMBER access for a budget mutation', async () => {
    const access = {
      getActiveMembership: vi.fn().mockRejectedValue(new ForbiddenException()),
    } as unknown as HouseholdAccessService;
    const repository = { create: vi.fn() } as unknown as PrismaBudgetRepository;
    const service = new BudgetService(access, repository);
    await expect(
      service.create('viewer', {
        name: 'Červenec',
        currencyCode: 'CZK',
        periodType: 'MONTHLY',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        status: 'DRAFT',
        allocations: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(access.getActiveMembership).toHaveBeenCalledWith('viewer', 'MEMBER');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects a category from another household or an archived category', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a' }),
    } as unknown as HouseholdAccessService;
    const repository = {
      listCategories: vi
        .fn()
        .mockResolvedValue([
          { id: 'category', kind: 'EXPENSE', archivedAt: new Date() },
        ]),
    } as unknown as PrismaBudgetRepository;
    const service = new BudgetService(access, repository);
    await expect(
      service.create('user', {
        name: 'Červenec',
        currencyCode: 'CZK',
        periodType: 'MONTHLY',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        status: 'DRAFT',
        allocations: [
          {
            categoryId: 'category',
            limitMinor: '100000',
            warningThresholdPercent: 80,
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'FINANCE_INVALID_INPUT' });
  });

  it('copies only configured limits and safely refuses an existing target', async () => {
    const source = {
      id: 'budget-id',
      name: 'Červenec',
      currencyCode: 'CZK',
      periodType: 'MONTHLY',
      periodStart: new Date('2026-07-01'),
      periodEnd: new Date('2026-07-31'),
      totalLimitMinor: 1_000_000n,
      status: 'ACTIVE',
      archivedAt: null,
      allocations: [],
    };
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a' }),
    } as unknown as HouseholdAccessService;
    const repository = {
      find: vi.fn().mockResolvedValue(source),
      copy: vi.fn().mockResolvedValue(null),
    } as unknown as PrismaBudgetRepository;
    const service = new BudgetService(access, repository);
    await expect(
      service.copy('user', 'budget-id', {
        targetMonth: '2026-08-01',
      }),
    ).rejects.toMatchObject({ code: 'FINANCE_CONFLICT' });
    expect(repository.copy).toHaveBeenCalledWith(
      expect.objectContaining({
        source,
        targetStart: new Date('2026-08-01T00:00:00.000Z'),
        targetEnd: new Date('2026-08-31T00:00:00.000Z'),
      }),
    );
  });
});

describe('budget summary reporting boundary', () => {
  it('counts card purchases and uncategorized expense, subtracts refunds, and ignores transfers', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a' }),
    } as unknown as HouseholdAccessService;
    const budgets = {
      find: vi.fn().mockResolvedValue({
        id: 'budget',
        name: 'Červenec',
        currencyCode: 'CZK',
        status: 'ACTIVE',
        periodStart: new Date('2026-07-01'),
        periodEnd: new Date('2026-07-31'),
        totalLimitMinor: 100_000n,
        allocations: [
          {
            id: 'allocation',
            categoryId: 'category',
            limitMinor: 50_000n,
            warningThresholdPercent: 80,
            category: { id: 'category', name: 'Potraviny' },
          },
        ],
      }),
    } as unknown as PrismaBudgetRepository;
    const analytics = {
      loadExpenseHistory: vi.fn().mockResolvedValue([
        row('expense', 'EXPENSE', 60_000n, {
          id: 'category',
          name: 'Potraviny',
        }),
        row('card', 'EXPENSE', 20_000n, null),
        row('refund', 'REFUND', 10_000n, {
          id: 'category',
          name: 'Potraviny',
        }),
        row('transfer', 'TRANSFER_OUT', 999_999n, null),
      ]),
    } as unknown as FinanceAnalyticsFacade;
    const summary = await new BudgetSummaryService(
      access,
      budgets,
      analytics,
    ).get('user', 'budget', new Date('2026-07-10T12:00:00.000Z'));
    expect(summary.total).toMatchObject({
      spentMinor: '80000',
      refundedMinor: '10000',
      netSpentMinor: '70000',
      remainingMinor: '30000',
      usedPercent: 70,
    });
    expect(summary.uncategorized.netSpentMinor).toBe('20000');
    expect(summary.allocations[0]).toMatchObject({
      netSpentMinor: '50000',
      status: 'EXCEEDED',
    });
    expect(analytics.loadExpenseHistory).toHaveBeenCalledWith(
      'user',
      expect.objectContaining({
        currencyCode: 'CZK',
      }),
    );
  });
});

describe('explainable spending insight rules', () => {
  it('requires both absolute and relative category growth with at least two history periods', () => {
    const rows = [
      row(
        'old-a',
        'EXPENSE',
        200_000n,
        { id: 'food', name: 'Restaurace' },
        '2026-05-10',
      ),
      row(
        'old-b',
        'EXPENSE',
        210_000n,
        { id: 'food', name: 'Restaurace' },
        '2026-06-10',
      ),
      row(
        'current',
        'EXPENSE',
        400_000n,
        { id: 'food', name: 'Restaurace' },
        '2026-07-10',
      ),
    ];
    const insights = detectInsights(rows, insightPeriod());
    expect(insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'CATEGORY_SPENDING_INCREASE' }),
      ]),
    );
    expect(detectInsights(rows.slice(1), insightPeriod())).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'CATEGORY_SPENDING_INCREASE' }),
      ]),
    );
  });

  it('uses normalized merchant identity and comparable elapsed days only', () => {
    const rows = [
      row(
        'may-visible',
        'EXPENSE',
        100_000n,
        null,
        '2026-05-10',
        'NORMALIZED SHOP',
      ),
      row(
        'may-late',
        'EXPENSE',
        900_000n,
        null,
        '2026-05-28',
        'NORMALIZED SHOP',
      ),
      row(
        'june-visible',
        'EXPENSE',
        100_000n,
        null,
        '2026-06-10',
        'NORMALIZED SHOP',
      ),
      row(
        'current',
        'EXPENSE',
        250_000n,
        null,
        '2026-07-10',
        'NORMALIZED SHOP',
      ),
    ];
    expect(detectInsights(rows, insightPeriod())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'MERCHANT_SPENDING_INCREASE' }),
      ]),
    );
  });

  it('groups frequent small purchases instead of producing one insight per transaction', () => {
    const rows = Array.from({ length: 6 }, (_, index) =>
      row(
        `small-${String(index)}`,
        'EXPENSE',
        20_000n,
        null,
        `2026-07-${String(index + 1).padStart(2, '0')}`,
        'KAVÁRNA',
      ),
    );
    const insights = detectInsights(rows, insightPeriod()).filter(
      (insight) => insight.type === 'FREQUENT_SMALL_PURCHASES',
    );
    expect(insights).toHaveLength(1);
    expect(insights[0]?.evidenceJson).toMatchObject({
      count: 6,
      totalMinor: '120000',
    });
  });

  it('creates deterministic budget threshold, exceed and forecast evidence', () => {
    const drafts = budgetInsightDrafts(summaryFixture());
    expect(drafts.map((item) => item.type)).toEqual([
      'BUDGET_EXCEEDED',
      'BUDGET_THRESHOLD_REACHED',
      'BUDGET_FORECAST_EXCEEDED',
    ]);
    expect(JSON.stringify(drafts)).not.toContain('merchant');
  });

  it('does not recreate a dismissed evidence hash but accepts changed evidence', async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({ id: 'dismissed', status: 'DISMISSED' })
      .mockResolvedValueOnce(null);
    const upsert = vi.fn().mockResolvedValue({});
    const prisma = {
      spendingInsight: { findUnique, upsert },
    } as unknown as PrismaService;
    const repository = new PrismaInsightRepository(prisma, {} as AuditService);
    const base = {
      type: 'NEW_LARGE_EXPENSE' as const,
      currencyCode: 'CZK',
      periodStart: new Date('2026-07-01'),
      periodEnd: new Date('2026-07-31'),
      severity: 'INFO' as const,
      title: 'Vyšší výdaj',
      explanation: 'Bez hodnocení.',
      evidenceJson: {},
    };
    await repository.upsertMany('household', [
      { ...base, evidenceHash: 'same' },
      { ...base, evidenceHash: 'changed' },
    ]);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          householdId_evidenceHash: {
            householdId: 'household',
            evidenceHash: 'changed',
          },
        },
      }),
    );
  });
});

function row(
  id: string,
  type: FinancialTransactionType,
  amountMinor: bigint,
  category: { id: string; name: string } | null,
  bookedDate = '2026-07-05',
  merchantNormalizedName: string | null = null,
) {
  return {
    id,
    accountId: 'account',
    type,
    amountMinor,
    currencyCode: 'CZK',
    bookedDate: new Date(`${bookedDate}T00:00:00.000Z`),
    merchantNormalizedName,
    counterpartyName: null,
    category,
  };
}

const insightPeriod = () => ({
  periodStart: new Date('2026-07-01T00:00:00.000Z'),
  periodEnd: new Date('2026-07-31T00:00:00.000Z'),
  currencyCode: 'CZK',
  comparisonDay: 15,
});

function summaryLine(
  id: string,
  status: 'EXCEEDED' | 'APPROACHING' | 'FORECAST_EXCEEDED',
  category: { id: string; name: string } | null,
) {
  return {
    id,
    category,
    limitMinor: '100000',
    spentMinor: '90000',
    refundedMinor: '0',
    netSpentMinor: status === 'EXCEEDED' ? '110000' : '90000',
    remainingMinor: '10000',
    usedPercent: status === 'EXCEEDED' ? 110 : 90,
    daysElapsed: 15,
    daysRemaining: 16,
    forecast: {
      status: 'AVAILABLE' as const,
      amountMinor: status === 'FORECAST_EXCEEDED' ? '120000' : '95000',
      percent: status === 'FORECAST_EXCEEDED' ? 120 : 95,
    },
    warningThresholdPercent: 80,
    status,
  };
}

function summaryFixture(): Parameters<typeof budgetInsightDrafts>[0] {
  return {
    budget: {
      id: 'budget',
      name: 'Červenec',
      currencyCode: 'CZK',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      status: 'ACTIVE',
    },
    total: summaryLine('total', 'EXCEEDED', null),
    allocations: [
      summaryLine('warning', 'APPROACHING', { id: 'food', name: 'Potraviny' }),
      summaryLine('forecast', 'FORECAST_EXCEEDED', {
        id: 'home',
        name: 'Domácnost',
      }),
    ],
    uncategorized: { spentMinor: '0', refundedMinor: '0', netSpentMinor: '0' },
  };
}
