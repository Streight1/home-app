import { formatMinorUnits } from '../../../finance/finance.public.js';
import type { FinanceCurrency } from '../../../finance/types/finance.types.js';
import type { BudgetSummaryLine } from '../../types/finance-budget.types.js';

export function BudgetCategoryComparisonChart({
  items,
  currencyCode,
}: {
  items: BudgetSummaryLine[];
  currencyCode: FinanceCurrency;
}) {
  if (!items.length) return null;
  return (
    <div
      className="grid gap-3"
      role="img"
      aria-label="Srovnání čerpání, limitu a odhadu kategorií"
    >
      {items.map((item) => {
        const spent = BigInt(item.netSpentMinor);
        const limit = item.limitMinor === null ? null : BigInt(item.limitMinor);
        const forecast =
          item.forecast.amountMinor === null
            ? null
            : BigInt(item.forecast.amountMinor);
        const maximum = [spent, limit ?? 0n, forecast ?? 0n].reduce(
          (current, value) => (value > current ? value : current),
          1n,
        );
        const width = (value: bigint) => Number((value * 100n) / maximum);
        return (
          <div key={item.id} className="grid gap-1.5">
            <div className="flex justify-between gap-3 text-caption">
              <span>{item.category?.name ?? 'Celkem'}</span>
              <span className="tabular-nums text-text-muted">
                {formatMinorUnits(item.netSpentMinor, currencyCode)}
              </span>
            </div>
            <div className="grid gap-1" aria-hidden="true">
              <span
                className="h-1.5 rounded-full bg-primary"
                style={{ width: `${String(width(spent))}%` }}
              />
              {limit === null ? null : (
                <span
                  className="h-1.5 rounded-full bg-border-strong"
                  style={{ width: `${String(width(limit))}%` }}
                />
              )}
              {forecast === null ? null : (
                <span
                  className="h-1.5 rounded-full bg-warning"
                  style={{ width: `${String(width(forecast))}%` }}
                />
              )}
            </div>
            <span className="sr-only">
              Čerpání {formatMinorUnits(item.netSpentMinor, currencyCode)}.{' '}
              {item.limitMinor
                ? `Limit ${formatMinorUnits(item.limitMinor, currencyCode)}.`
                : 'Bez limitu.'}{' '}
              {item.forecast.amountMinor
                ? `Odhad ${formatMinorUnits(item.forecast.amountMinor, currencyCode)}.`
                : 'Pro odhad zatím není dost dat.'}
            </span>
          </div>
        );
      })}
      <p className="flex flex-wrap gap-3 text-caption text-text-muted">
        <span>Primární: čerpání</span>
        <span>Šedá: limit</span>
        <span>Varovná: odhad</span>
      </p>
    </div>
  );
}
