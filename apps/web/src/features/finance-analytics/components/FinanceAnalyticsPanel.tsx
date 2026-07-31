import { BarChart3 } from 'lucide-react';
import { Card } from '../../../components/ui/Card/Card.js';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { formatMinorUnits } from '../../finance/lib/money.js';
import { useFinanceAnalytics } from '../hooks/useFinanceAnalytics.js';
import { CategorySpendingChart } from './CategorySpendingChart.js';
import { SpendingTrendChart } from './SpendingTrendChart.js';

export interface FinanceAnalyticsDrilldownFilters {
  query?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function FinanceAnalyticsPanel({
  onOpenTransactions,
}: {
  onOpenTransactions: (filters: FinanceAnalyticsDrilldownFilters) => void;
}) {
  const analytics = useFinanceAnalytics();
  if (analytics.isPending)
    return (
      <p role="status" className="text-body-sm text-text-muted">
        Počítáme finanční přehled…
      </p>
    );
  if (analytics.isError)
    return (
      <InlineAlert variant="danger">
        Analytiku se nepodařilo načíst.{' '}
        <button
          className="min-h-11 underline"
          onClick={() => void analytics.refetch()}
        >
          Zkusit znovu
        </button>
      </InlineAlert>
    );
  if (!analytics.data.summary.currencies.length)
    return (
      <EmptyState
        eyebrow={<BarChart3 className="mx-auto size-5" aria-hidden="true" />}
        title="Zatím není co analyzovat"
        description="Grafy se naplní skutečnými výdaji. Převody a splátky kreditních karet se do výdajů nepočítají."
      />
    );
  return (
    <div className="grid gap-6">
      {analytics.data.summary.currencies.map((summary) => {
        const currency = summary.currencyCode;
        const categories =
          analytics.data.categories.currencies.find(
            (item) => item.currencyCode === currency,
          )?.items ?? [];
        const trend =
          analytics.data.trend.currencies.find(
            (item) => item.currencyCode === currency,
          )?.points ?? [];
        const merchants =
          analytics.data.merchants.currencies.find(
            (item) => item.currencyCode === currency,
          )?.items ?? [];
        const comparison =
          analytics.data.comparison.currencies.find(
            (item) => item.currencyCode === currency,
          )?.items ?? [];
        return (
          <section
            key={currency}
            className="grid gap-4 lg:grid-cols-2"
            aria-labelledby={`analytics-${currency}`}
          >
            <h2
              id={`analytics-${currency}`}
              className="lg:col-span-2 text-section-title font-semibold"
            >
              Výdaje · {currency}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
              <Metric
                label="Výdaje"
                value={formatMinorUnits(summary.expenseMinor, currency)}
              />
              <Metric
                label="Proti minulému období"
                value={formatDifference(summary.expenseChangeMinor, currency)}
              />
              <Metric
                label="Nezařazené transakce"
                value={String(summary.uncategorizedCount)}
              />
            </div>
            <Card className="p-5">
              <h3 className="font-semibold">Výdaje podle kategorií</h3>
              <div className="mt-4">
                <CategorySpendingChart
                  items={categories}
                  currencyCode={currency}
                  onSelect={(item) =>
                    onOpenTransactions(
                      cleanFilters(item.navigationTarget.filters),
                    )
                  }
                />
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold">Vývoj výdajů</h3>
              <div className="mt-4">
                <SpendingTrendChart
                  points={trend}
                  onSelect={(point) =>
                    onOpenTransactions(
                      cleanFilters(point.navigationTarget.filters),
                    )
                  }
                />
              </div>
            </Card>
            <Card className="p-5 lg:col-span-2">
              <h3 className="font-semibold">Největší obchodníci</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {merchants.slice(0, 8).map((merchant) => (
                  <button
                    key={merchant.merchant}
                    className="min-h-11 rounded-md bg-surface-subtle px-3 py-2 text-left hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                    onClick={() =>
                      onOpenTransactions(
                        cleanFilters(merchant.navigationTarget.filters),
                      )
                    }
                  >
                    <span className="font-medium">{merchant.merchant}</span>
                    <span className="ml-2 tabular-nums text-text-muted">
                      {formatMinorUnits(merchant.amountMinor, currency)}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
            <Card className="p-5 lg:col-span-2">
              <h3 className="font-semibold">Porovnání s předchozím obdobím</h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {comparison.slice(0, 8).map((item) => (
                  <button
                    key={item.categoryId ?? 'uncategorized'}
                    type="button"
                    className="min-h-11 rounded-md bg-surface-subtle px-3 py-2 text-left hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                    onClick={() =>
                      onOpenTransactions(
                        cleanFilters(item.navigationTarget.filters),
                      )
                    }
                  >
                    <span className="font-medium">{item.name}: </span>
                    <span className="text-text-muted">
                      {comparisonLabel(item.differenceMinor, currency)}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
function cleanFilters(filters: {
  query?: string;
  categoryId?: string | null;
  dateFrom?: string;
  dateTo?: string;
}) {
  return {
    ...(filters.query ? { query: filters.query } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
  };
}
function comparisonLabel(value: string, currency: 'CZK' | 'EUR') {
  const difference = BigInt(value);
  if (difference === 0n) return 'stejně jako minule';
  return `${formatMinorUnits(
    (difference < 0n ? -difference : difference).toString(),
    currency,
  )} ${difference > 0n ? 'více' : 'méně'} než minule`;
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-raised p-4">
      <p className="text-caption text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
function formatDifference(value: string, currency: 'CZK' | 'EUR') {
  const amount = BigInt(value);
  return `${amount > 0n ? '+' : ''}${formatMinorUnits(value, currency)}`;
}
