import { Card } from '../../../../components/ui/Card/Card.js';
import { formatMinorUnits } from '../../lib/money.js';
import type { FinanceSummary } from '../../types/finance.types.js';

export function ExpenseCategoryBreakdown({
  currencies,
  onShowCategory,
}: {
  currencies: FinanceSummary['currencies'];
  onShowCategory: (categoryId: string) => void;
}) {
  const visible = currencies.filter(
    (currency) =>
      (currency.topExpenseCategories?.length ?? 0) > 0 ||
      currency.uncategorizedExpenseCount > 0,
  );
  if (visible.length === 0) return null;
  return (
    <section aria-labelledby="expense-breakdown-title">
      <h2
        id="expense-breakdown-title"
        className="text-section-title font-semibold"
      >
        Největší výdajové kategorie
      </h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {visible.map((currency) => (
          <Card key={currency.currencyCode} className="p-5">
            <p className="text-caption font-semibold uppercase tracking-wider text-text-muted">
              {currency.currencyCode}
            </p>
            <ul className="mt-3 grid gap-3">
              {currency.topExpenseCategories?.map((category) => (
                <li key={category.categoryId}>
                  <div className="flex justify-between gap-3 text-body-sm">
                    <button
                      type="button"
                      className="min-h-11 text-left font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus"
                      onClick={() => onShowCategory(category.categoryId)}
                    >
                      {category.name}
                    </button>
                    <span className="font-medium tabular-nums">
                      {formatMinorUnits(
                        category.amountMinor,
                        currency.currencyCode,
                      )}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-skeleton"
                    aria-label={`${category.name}: ${String(category.shareBasisPoints / 100)} % výdajů`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={category.shareBasisPoints / 100}
                    role="progressbar"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${String(Math.min(category.shareBasisPoints / 100, 100))}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            {currency.uncategorizedExpenseCount > 0 ? (
              <p className="mt-4 text-body-sm text-warning">
                Nezařazené výdaje: {currency.uncategorizedExpenseCount}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
