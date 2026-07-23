import { ArrowRight, CircleDollarSign, Plus } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useFinanceDashboard } from '../../hooks/useFinance.js';
import { formatMinorUnits } from '../../lib/money.js';

export function FinanceDashboardWidget({
  canWrite = true,
}: {
  canWrite?: boolean;
}) {
  const workspace = useWorkspaceNavigation();
  const dashboard = useFinanceDashboard();
  const currencies = Array.isArray(dashboard.data?.currencies)
    ? dashboard.data.currencies
    : [];
  return (
    <section
      className="md:col-span-12"
      aria-labelledby="finance-dashboard-title"
    >
      <div className="rounded-lg border border-border bg-surface-raised p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              Ruční ledger
            </p>
            <h2
              id="finance-dashboard-title"
              className="mt-1 text-section-title font-semibold"
            >
              Finance
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite ? (
              <>
                <Button
                  onClick={() =>
                    workspace.openOverlay({
                      kind: 'finance-transaction',
                      type: 'expense',
                    })
                  }
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Přidat výdaj
                </Button>
                <Button
                  onClick={() =>
                    workspace.openOverlay({
                      kind: 'finance-transaction',
                      type: 'income',
                    })
                  }
                >
                  Přidat příjem
                </Button>
              </>
            ) : null}
            <Button
              variant="ghost"
              onClick={() =>
                workspace.navigate({ area: 'finance', screen: 'overview' })
              }
            >
              Zobrazit finance
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        {dashboard.isError ? (
          <div className="mt-4">
            <InlineAlert variant="danger">
              Finanční přehled se nepodařilo načíst.{' '}
              <button
                className="min-h-11 px-2 underline"
                onClick={() => void dashboard.refetch()}
              >
                Zkusit znovu
              </button>
            </InlineAlert>
          </div>
        ) : null}
        {dashboard.data && currencies.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              compact
              eyebrow={
                <CircleDollarSign
                  className="mx-auto size-5"
                  aria-hidden="true"
                />
              }
              title="Zatím nejsou žádné výdaje"
              description="Přehled se naplní skutečnými transakcemi. Převody se do výdajů nepočítají."
            />
          </div>
        ) : null}
        {currencies.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {currencies.map((currency) => (
              <div
                key={currency.currencyCode}
                className="rounded-md bg-surface-subtle p-4"
              >
                <p className="text-caption text-text-muted">
                  Výdaje tento měsíc · {currency.currencyCode}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatMinorUnits(
                    currency.expenseMinor,
                    currency.currencyCode,
                  )}
                </p>
                <p className="mt-2 text-caption text-text-muted">
                  Proti minulému období{' '}
                  {formatMinorUnits(
                    currency.expenseChangeMinor,
                    currency.currencyCode,
                  )}
                </p>
                {currency.topCategory ? (
                  <p className="mt-2 text-caption text-text-muted">
                    Největší kategorie: {currency.topCategory.name}
                  </p>
                ) : null}
                {currency.uncategorizedCount > 0 ? (
                  <p className="mt-1 text-caption text-warning">
                    Nezařazené transakce: {currency.uncategorizedCount}
                  </p>
                ) : null}
                {currency.trend.length ? (
                  <div
                    className="mt-3 flex h-10 items-end gap-1"
                    role="img"
                    aria-label={`Kompaktní trend výdajů v měně ${currency.currencyCode}`}
                  >
                    {currency.trend.slice(-12).map((point) => {
                      const maximum = currency.trend.reduce(
                        (current, item) =>
                          BigInt(item.expenseMinor) > current
                            ? BigInt(item.expenseMinor)
                            : current,
                        1n,
                      );
                      const ratio =
                        (BigInt(point.expenseMinor) * 100n) / maximum;
                      const height = (ratio < 8n ? 8n : ratio).toString();
                      return (
                        <span
                          key={point.period}
                          className="min-h-1 flex-1 rounded-t-sm bg-primary-soft"
                          style={{ height: `${height}%` }}
                          title={point.period}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
