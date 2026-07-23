import { createHash } from 'node:crypto';
import type {
  Prisma,
  SpendingInsightSeverity,
  SpendingInsightType,
} from '../../../generated/prisma/client.js';
import { dateOnlyString } from '../../finance/domain/finance.types.js';
import type { InsightDraft } from '../infrastructure/prisma-insight.repository.js';

export interface InsightHistoryRow {
  id: string;
  type: string;
  amountMinor: bigint;
  currencyCode: string;
  bookedDate: Date;
  merchantNormalizedName: string | null;
  category: { id: string; name: string } | null;
}

interface InsightPeriod {
  periodStart: Date;
  periodEnd: Date;
  currencyCode: string;
  comparisonDay: number;
}

export function detectInsights(
  rows: readonly InsightHistoryRow[],
  period: InsightPeriod,
): InsightDraft[] {
  const current = rows.filter(
    (row) => row.bookedDate >= period.periodStart && row.type === 'EXPENSE',
  );
  const history = rows.filter(
    (row) =>
      row.bookedDate < period.periodStart &&
      row.bookedDate.getUTCDate() <= period.comparisonDay &&
      row.type === 'EXPENSE',
  );
  const drafts: InsightDraft[] = [];
  const historyMonths = new Set(
    history.map((row) => dateOnlyString(row.bookedDate).slice(0, 7)),
  );
  if (historyMonths.size >= 2) {
    drafts.push(...growthInsights(current, history, period, 'category'));
    drafts.push(...growthInsights(current, history, period, 'merchant'));
  }
  drafts.push(...smallPurchaseInsights(current, period));
  const total = current.reduce((sum, row) => sum + row.amountMinor, 0n);
  const uncategorized = current
    .filter((row) => !row.category)
    .reduce((sum, row) => sum + row.amountMinor, 0n);
  if (
    total > 0n &&
    uncategorized * 100n >= total * 20n &&
    uncategorized >= significantAmount(period.currencyCode)
  ) {
    drafts.push(
      draft(
        'UNCATEGORIZED_SPENDING_HIGH',
        'WARNING',
        'Část výdajů zůstává nezařazená',
        'Vyšší část výdajů nemá kategorii. Zařazení pomůže zpřesnit přehled.',
        period,
        {
          kind: 'uncategorized',
          amountMinor: uncategorized.toString(),
          totalMinor: total.toString(),
        },
      ),
    );
  }
  const baseline = medianBigInt(history.map((row) => row.amountMinor));
  for (const row of current
    .filter(
      (candidate) =>
        candidate.amountMinor >= largeAmount(period.currencyCode) &&
        candidate.amountMinor >= baseline * 3n,
    )
    .slice(0, 3)) {
    drafts.push(
      draft(
        'NEW_LARGE_EXPENSE',
        'INFO',
        'Nový vyšší výdaj',
        `Tato platba je výrazně vyšší než většina dřívějších výdajů${row.category ? ` v kategorii ${row.category.name}` : ''}.`,
        period,
        {
          kind: 'large-expense',
          transactionId: row.id,
          categoryId: row.category?.id ?? null,
          amountMinor: row.amountMinor.toString(),
          baselineMinor: baseline.toString(),
        },
      ),
    );
  }
  return drafts;
}

function growthInsights(
  current: readonly InsightHistoryRow[],
  history: readonly InsightHistoryRow[],
  period: Omit<InsightPeriod, 'comparisonDay'>,
  mode: 'category' | 'merchant',
) {
  const key = (row: InsightHistoryRow) =>
    mode === 'category'
      ? (row.category?.id ?? null)
      : row.merchantNormalizedName;
  const result: InsightDraft[] = [];
  for (const groupKey of new Set(
    current.map(key).filter((value): value is string => Boolean(value)),
  )) {
    const currentRows = current.filter((row) => key(row) === groupKey);
    const currentAmount = currentRows.reduce(
      (sum, row) => sum + row.amountMinor,
      0n,
    );
    const perMonth = new Map<string, bigint>();
    for (const row of history.filter(
      (candidate) => key(candidate) === groupKey,
    )) {
      const month = dateOnlyString(row.bookedDate).slice(0, 7);
      perMonth.set(month, (perMonth.get(month) ?? 0n) + row.amountMinor);
    }
    if (perMonth.size < 2) continue;
    const baseline = medianBigInt([...perMonth.values()]);
    const difference = currentAmount - baseline;
    if (
      baseline <= 0n ||
      difference < significantAmount(period.currencyCode) ||
      currentAmount * 100n < baseline * 125n
    )
      continue;
    const label =
      mode === 'category'
        ? (currentRows[0]?.category?.name ?? 'Kategorie')
        : groupKey;
    result.push(
      draft(
        mode === 'category'
          ? 'CATEGORY_SPENDING_INCREASE'
          : 'MERCHANT_SPENDING_INCREASE',
        'WARNING',
        `${label}: výdaje jsou výše než obvykle`,
        'V aktuálním období jsou výdaje vyšší než medián alespoň dvou předchozích období.',
        period,
        {
          kind: mode,
          key: groupKey,
          label,
          currentMinor: currentAmount.toString(),
          baselineMinor: baseline.toString(),
          comparisonPeriods: perMonth.size,
        },
      ),
    );
  }
  return result;
}

function smallPurchaseInsights(
  current: readonly InsightHistoryRow[],
  period: Omit<InsightPeriod, 'comparisonDay'>,
) {
  const maximum = period.currencyCode === 'CZK' ? 30_000n : 1_500n;
  const minimumTotal = period.currencyCode === 'CZK' ? 100_000n : 5_000n;
  const grouped = new Map<string, InsightHistoryRow[]>();
  for (const row of current.filter((item) => item.amountMinor <= maximum)) {
    const key = row.merchantNormalizedName ?? row.category?.id;
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return [...grouped.entries()].flatMap(([key, items]) => {
    const sum = items.reduce((value, item) => value + item.amountMinor, 0n);
    if (items.length < 5 || sum < minimumTotal) return [];
    const label =
      items[0]?.merchantNormalizedName ??
      items[0]?.category?.name ??
      'Drobné nákupy';
    return [
      draft(
        'FREQUENT_SMALL_PURCHASES',
        'INFO',
        `${label}: časté menší nákupy`,
        'Velkou část této útraty tvoří opakované menší nákupy.',
        period,
        {
          kind: 'small-purchases',
          key,
          label,
          count: items.length,
          totalMinor: sum.toString(),
        },
      ),
    ];
  });
}

function draft(
  type: SpendingInsightType,
  severity: SpendingInsightSeverity,
  title: string,
  explanation: string,
  period: { periodStart: Date; periodEnd: Date; currencyCode: string },
  evidence: Prisma.InputJsonObject,
): InsightDraft {
  const identity = JSON.stringify({
    type,
    currencyCode: period.currencyCode,
    period: dateOnlyString(period.periodStart),
    evidence,
  });
  return {
    type,
    severity,
    title,
    explanation,
    currencyCode: period.currencyCode,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    evidenceJson: evidence,
    evidenceHash: createHash('sha256').update(identity).digest('hex'),
  };
}

export const createInsightDraft = draft;

function medianBigInt(values: readonly bigint[]) {
  if (!values.length) return 0n;
  const sorted = [...values].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  return sorted[Math.floor(sorted.length / 2)] ?? 0n;
}

const significantAmount = (currency: string) =>
  currency === 'CZK' ? 100_000n : 5_000n;
const largeAmount = (currency: string) =>
  currency === 'CZK' ? 500_000n : 20_000n;
