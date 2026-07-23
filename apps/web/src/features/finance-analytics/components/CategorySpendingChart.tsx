import { Button } from '../../../components/ui/Button/Button.js';
import { formatMinorUnits } from '../../finance/lib/money.js';
import type { CategoryBreakdownItem } from '../types/finance-analytics.types.js';

export function CategorySpendingChart({
  items,
  currencyCode,
  onSelect,
}: {
  items: CategoryBreakdownItem[];
  currencyCode: 'CZK' | 'EUR';
  onSelect: (item: CategoryBreakdownItem) => void;
}) {
  const maximum = items.reduce(
    (max, item) =>
      BigInt(item.amountMinor) > max ? BigInt(item.amountMinor) : max,
    0n,
  );
  if (!items.length)
    return (
      <p className="text-body-sm text-text-muted">
        Ve zvoleném období nejsou žádné výdaje.
      </p>
    );
  return (
    <div className="grid gap-3">
      {items.slice(0, 8).map((item) => {
        const width =
          maximum === 0n
            ? 0
            : Number((BigInt(item.amountMinor) * 100n) / maximum);
        return (
          <div key={item.categoryId ?? 'uncategorized'}>
            <div className="flex items-baseline justify-between gap-3 text-body-sm">
              <Button
                variant="ghost"
                className="min-h-0 p-0 text-left"
                onClick={() => onSelect(item)}
              >
                {item.name}
              </Button>
              <span className="font-medium tabular-nums">
                {formatMinorUnits(item.amountMinor, currencyCode)}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-skeleton">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${String(Math.max(2, width))}%` }}
              />
              <span className="sr-only">
                {item.shareBasisPoints / 100} procent, {item.transactionCount}{' '}
                transakcí
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
