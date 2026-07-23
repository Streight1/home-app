export type RecurringFrequency =
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'
  | 'IRREGULAR';

export interface RecurringPatternInput {
  bookedDate: Date;
  amountMinor: bigint;
}

const DAY_MS = 86_400_000;

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const value = sorted[middle];
  return value ?? 0;
}

export function detectRecurringPattern(rows: readonly RecurringPatternInput[]) {
  if (rows.length < 3) return null;
  const sorted = [...rows].sort(
    (left, right) => left.bookedDate.getTime() - right.bookedDate.getTime(),
  );
  const intervals = sorted.slice(1).map((row, index) => {
    const previous = sorted[index];
    if (!previous) return 0;
    return Math.round(
      (row.bookedDate.getTime() - previous.bookedDate.getTime()) / DAY_MS,
    );
  });
  const interval = median(intervals);
  let frequency: RecurringFrequency = 'IRREGULAR';
  if (interval >= 5 && interval <= 9) frequency = 'WEEKLY';
  else if (interval >= 25 && interval <= 35) frequency = 'MONTHLY';
  else if (interval >= 75 && interval <= 105) frequency = 'QUARTERLY';
  else if (interval >= 330 && interval <= 400) frequency = 'YEARLY';
  if (frequency === 'IRREGULAR') return null;
  const amounts = sorted
    .map((row) => row.amountMinor)
    .sort((a, b) => (a < b ? -1 : 1));
  const typicalAmountMinor = amounts[Math.floor(amounts.length / 2)] ?? 0n;
  if (
    typicalAmountMinor <= 0n ||
    amounts.some((amount) => {
      const difference =
        amount >= typicalAmountMinor
          ? amount - typicalAmountMinor
          : typicalAmountMinor - amount;
      return difference * 100n > typicalAmountMinor * 20n;
    })
  )
    return null;
  const last = sorted.at(-1);
  const first = sorted[0];
  if (!last || !first) return null;
  const nextExpectedDate = new Date(
    last.bookedDate.getTime() + interval * DAY_MS,
  );
  const intervalSpread = Math.max(...intervals) - Math.min(...intervals);
  const confidenceScore = Math.max(
    40,
    Math.min(95, 90 - intervalSpread * 3 + rows.length),
  );
  return {
    frequency,
    typicalAmountMinor,
    nextExpectedDate,
    confidenceScore,
    firstObservedDate: first.bookedDate,
    lastObservedDate: last.bookedDate,
    evidenceTransactionCount: rows.length,
  };
}
