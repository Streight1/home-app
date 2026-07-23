import { Card } from '../../../../components/ui/Card/Card.js';
import { formatMinorUnits } from '../../../finance/finance.public.js';
import type { BudgetSummary } from '../../types/finance-budget.types.js';
import { BudgetCategoryComparisonChart } from '../charts/BudgetCategoryComparisonChart.js';
import { BudgetProgress } from './BudgetProgress.js';

export function BudgetSummaryCard({ summary }: { summary: BudgetSummary }) {
  const currency = summary.budget.currencyCode;
  return (
    <div className="grid gap-4">
      <Card className="p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-caption text-text-muted">
              {summary.budget.periodStart} – {summary.budget.periodEnd}
            </p>
            <h2 className="mt-1 text-section-title font-semibold">
              {summary.budget.name}
            </h2>
            <div className="mt-4">
              <BudgetProgress line={summary.total} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-right tabular-nums lg:min-w-80">
            <div>
              <dt className="text-caption text-text-muted">Čerpání</dt>
              <dd className="mt-1 font-semibold">
                {formatMinorUnits(summary.total.netSpentMinor, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-text-muted">Zbývá</dt>
              <dd className="mt-1 font-semibold">
                {summary.total.remainingMinor === null
                  ? 'Bez limitu'
                  : formatMinorUnits(summary.total.remainingMinor, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-text-muted">Odhad do konce</dt>
              <dd className="mt-1 font-semibold">
                {summary.total.forecast.amountMinor === null
                  ? 'Málo dat'
                  : formatMinorUnits(
                      summary.total.forecast.amountMinor,
                      currency,
                    )}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-text-muted">Dní do konce</dt>
              <dd className="mt-1 font-semibold">
                {summary.total.daysRemaining}
              </dd>
            </div>
          </dl>
        </div>
      </Card>
      <section aria-labelledby="category-budgets-title">
        <h2
          id="category-budgets-title"
          className="text-section-title font-semibold"
        >
          Kategorie proti limitu
        </h2>
        <div className="mt-4 rounded-lg border border-border bg-surface p-4">
          <BudgetCategoryComparisonChart
            items={summary.allocations}
            currencyCode={currency}
          />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {summary.allocations.map((allocation) => (
            <Card key={allocation.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{allocation.category?.name}</h3>
                <span className="tabular-nums text-caption text-text-muted">
                  {formatMinorUnits(allocation.netSpentMinor, currency)} /{' '}
                  {allocation.limitMinor
                    ? formatMinorUnits(allocation.limitMinor, currency)
                    : 'bez limitu'}
                </span>
              </div>
              <div className="mt-3">
                <BudgetProgress line={allocation} />
              </div>
              {allocation.forecast.amountMinor ? (
                <p className="mt-2 text-caption text-text-muted">
                  Odhad:{' '}
                  {formatMinorUnits(allocation.forecast.amountMinor, currency)}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
