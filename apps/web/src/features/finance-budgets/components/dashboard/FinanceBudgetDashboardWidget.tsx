import { ArrowRight, Gauge } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { formatMinorUnits } from '../../../finance/finance.public.js';
import { useBudgetDashboard } from '../../hooks/useFinanceBudgets.js';

export function FinanceBudgetDashboardWidget() {
  const workspace = useWorkspaceNavigation();
  const query = useBudgetDashboard();
  const budgets = query.data?.budgets ?? [];
  return (
    <section
      className="md:col-span-12"
      aria-labelledby="budget-dashboard-title"
    >
      <div className="rounded-lg border border-border bg-surface-raised p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              Měsíční limity
            </p>
            <h2
              id="budget-dashboard-title"
              className="mt-1 text-section-title font-semibold"
            >
              Rozpočty a zjištění
            </h2>
          </div>
          <Button
            variant="ghost"
            onClick={() =>
              workspace.navigate({ area: 'finance', screen: 'budgets' })
            }
          >
            Zobrazit rozpočty
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
        {query.isError ? (
          <div className="mt-4">
            <InlineAlert variant="danger">
              Rozpočtový přehled se nepodařilo načíst.
            </InlineAlert>
          </div>
        ) : null}
        {query.data && budgets.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              compact
              eyebrow={<Gauge className="mx-auto size-5" aria-hidden="true" />}
              title="Aktivní rozpočet není nastavený"
              description="Můžete vytvořit limity pro aktuální měsíc přímo ve financích."
              action={
                <Button
                  onClick={() =>
                    workspace.navigate({ area: 'finance', screen: 'budgets' })
                  }
                >
                  Vytvořit rozpočet
                </Button>
              }
            />
          </div>
        ) : null}
        {budgets.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {budgets.map((budget) => (
              <div key={budget.id} className="rounded-md bg-surface-subtle p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong>{budget.name}</strong>
                  <span className="tabular-nums text-caption text-text-muted">
                    {budget.usedPercent === null
                      ? 'Bez limitu'
                      : `${budget.usedPercent.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} %`}
                  </span>
                </div>
                <p className="mt-2 tabular-nums text-lg font-semibold">
                  {formatMinorUnits(budget.spentMinor, budget.currencyCode)}
                  {budget.limitMinor
                    ? ` z ${formatMinorUnits(budget.limitMinor, budget.currencyCode)}`
                    : ''}
                </p>
                {budget.mostUsedCategory ? (
                  <p className="mt-2 text-caption text-text-muted">
                    Nejvíce čerpaná kategorie: {budget.mostUsedCategory.name}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {query.data ? (
          <div className="mt-4 flex flex-wrap gap-4 text-caption text-text-muted">
            <span>Nová zjištění: {query.data.newInsightCount}</span>
            <span>
              Možné opakované platby: {query.data.recurringCandidateCount}
            </span>
          </div>
        ) : null}
        {query.data?.importantInsight ? (
          <button
            className="mt-3 min-h-11 w-full rounded-md border border-border bg-surface-subtle px-3 text-left text-body-sm hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
            onClick={() =>
              workspace.navigate({ area: 'finance', screen: 'insights' })
            }
          >
            {query.data.importantInsight.title}
          </button>
        ) : null}
      </div>
    </section>
  );
}
