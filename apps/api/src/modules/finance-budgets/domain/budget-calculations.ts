export type BudgetHealth =
  | 'SAFE'
  | 'APPROACHING'
  | 'EXCEEDED'
  | 'FORECAST_EXCEEDED'
  | 'NO_LIMIT';

export interface ForecastResult {
  status: 'AVAILABLE' | 'NOT_ENOUGH_DATA';
  amountMinor: bigint | null;
  percent: number | null;
}

const DAY_MS = 86_400_000;

export function inclusiveDays(from: Date, to: Date): number {
  const start = Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  );
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.max(1, Math.floor((end - start) / DAY_MS) + 1);
}

export function usedPercent(
  amount: bigint,
  limit: bigint | null,
): number | null {
  if (limit === null || limit <= 0n) return null;
  const safeAmount = amount > 0n ? amount : 0n;
  return Number((safeAmount * 10_000n) / limit) / 100;
}

export function forecastSpending(input: {
  netSpentMinor: bigint;
  limitMinor: bigint | null;
  daysElapsed: number;
  totalDays: number;
  transactionCount: number;
}): ForecastResult {
  if (input.daysElapsed < 5 || input.transactionCount < 3) {
    return { status: 'NOT_ENOUGH_DATA', amountMinor: null, percent: null };
  }
  const net = input.netSpentMinor > 0n ? input.netSpentMinor : 0n;
  const amountMinor =
    (net * BigInt(input.totalDays)) / BigInt(input.daysElapsed);
  return {
    status: 'AVAILABLE',
    amountMinor,
    percent: usedPercent(amountMinor, input.limitMinor),
  };
}

export function budgetHealth(input: {
  netSpentMinor: bigint;
  limitMinor: bigint | null;
  warningThresholdPercent: number;
  forecastMinor: bigint | null;
}): BudgetHealth {
  if (input.limitMinor === null) return 'NO_LIMIT';
  if (input.netSpentMinor >= input.limitMinor) return 'EXCEEDED';
  if (input.forecastMinor !== null && input.forecastMinor > input.limitMinor)
    return 'FORECAST_EXCEEDED';
  const percent = usedPercent(input.netSpentMinor, input.limitMinor) ?? 0;
  return percent >= input.warningThresholdPercent ? 'APPROACHING' : 'SAFE';
}

export function splitExpenseTotals(
  transactions: readonly { type: string; amountMinor: bigint }[],
) {
  let spentMinor = 0n;
  let refundedMinor = 0n;
  for (const transaction of transactions) {
    if (transaction.type === 'EXPENSE') spentMinor += transaction.amountMinor;
    if (transaction.type === 'REFUND') refundedMinor += transaction.amountMinor;
  }
  return {
    spentMinor,
    refundedMinor,
    netSpentMinor: spentMinor - refundedMinor,
  };
}
