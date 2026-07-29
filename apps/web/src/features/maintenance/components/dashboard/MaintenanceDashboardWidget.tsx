import { ArrowRight, Plus, Wrench } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useMaintenanceDashboard } from '../../hooks/useMaintenance.js';
import { formatMaintenanceDate } from '../../lib/maintenanceFormat.js';

export function MaintenanceDashboardWidget({
  canWrite = true,
}: {
  canWrite?: boolean;
}) {
  const workspace = useWorkspaceNavigation();
  const dashboard = useMaintenanceDashboard();
  const openMaintenance = () =>
    workspace.navigate({ area: 'maintenance', screen: 'overview' });
  return (
    <section
      className="md:col-span-12"
      aria-labelledby="maintenance-dashboard-title"
    >
      <div className="rounded-lg border border-border bg-surface-raised p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              Péče o domácnost
            </p>
            <h2
              id="maintenance-dashboard-title"
              className="mt-1 text-section-title font-semibold"
            >
              Údržba domácnosti
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite ? (
              <Button
                onClick={() =>
                  workspace.openOverlay({ kind: 'maintenance-plan-create' })
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Přidat plán
              </Button>
            ) : null}
            <Button onClick={openMaintenance}>
              Zobrazit údržbu
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        {dashboard.isLoading ? (
          <p className="mt-4 text-body-sm text-text-muted">Načítáme údržbu…</p>
        ) : null}
        {dashboard.isError ? (
          <div className="mt-4">
            <InlineAlert variant="danger">
              Přehled údržby se nepodařilo načíst.
              <button
                type="button"
                className="ml-3 min-h-11 rounded-md px-3 font-medium underline focus-visible:outline-2 focus-visible:outline-focus"
                onClick={() => void dashboard.refetch()}
              >
                Zkusit znovu
              </button>
            </InlineAlert>
          </div>
        ) : null}
        {dashboard.data ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Summary
              label="Po termínu"
              value={dashboard.data.summary.overdueTotal}
              danger
            />
            <Summary
              label="Během 7 dní"
              value={dashboard.data.summary.dueWithinSevenDaysTotal}
            />
            <Summary
              label="Pozastavené"
              value={dashboard.data.summary.pausedTotal}
            />
          </div>
        ) : null}
        {dashboard.data?.items.length ? (
          <ul className="mt-4 divide-y divide-border">
            {dashboard.data.items.slice(0, 4).map((item) => (
              <li key={item.id} className="py-3">
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-between gap-4 text-left focus-visible:outline-2 focus-visible:outline-focus"
                  onClick={() =>
                    workspace.navigate({
                      area: 'maintenance',
                      screen: 'plans',
                    })
                  }
                >
                  <span className="min-w-0">
                    <strong className="block truncate">{item.title}</strong>
                    <span className="text-caption text-text-muted">
                      {item.category?.name ?? 'Bez kategorie'}
                    </span>
                  </span>
                  <span
                    className={
                      item.overdue
                        ? 'shrink-0 font-semibold text-danger'
                        : 'shrink-0 text-text-muted'
                    }
                  >
                    {item.overdue ? 'Po termínu · ' : ''}
                    {formatMaintenanceDate(item.nextDueOn)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {dashboard.data && dashboard.data.items.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              compact
              eyebrow={<Wrench className="mx-auto size-5" aria-hidden="true" />}
              title="Nemáte žádnou nadcházející údržbu"
              description="Vytvořte první plán, až budete chtít hlídat pravidelnou péči."
              action={
                canWrite ? (
                  <Button
                    variant="primary"
                    onClick={() =>
                      workspace.openOverlay({
                        kind: 'maintenance-plan-create',
                      })
                    }
                  >
                    Přidat plán
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Summary({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <p className="text-caption text-text-muted">{label}</p>
      <strong className={danger && value ? 'text-danger' : 'text-text'}>
        {value}
      </strong>
    </div>
  );
}
