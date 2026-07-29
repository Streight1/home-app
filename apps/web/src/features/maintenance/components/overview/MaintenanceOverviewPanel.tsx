import { CalendarCheck, ClockAlert, PauseCircle, Wrench } from 'lucide-react';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen/LoadingScreen.js';
import { useMaintenanceDashboard } from '../../hooks/useMaintenance.js';
import { formatMaintenanceDate } from '../../lib/maintenanceFormat.js';

export function MaintenanceOverviewPanel() {
  const dashboard = useMaintenanceDashboard();
  if (dashboard.isLoading)
    return <LoadingScreen embedded message="Načítáme přehled údržby…" />;
  if (dashboard.isError)
    return (
      <InlineAlert variant="danger">
        Přehled údržby se nepodařilo načíst.
      </InlineAlert>
    );
  if (!dashboard.data) return null;
  const summary = dashboard.data.summary;
  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Summary
          icon={ClockAlert}
          label="Po termínu"
          value={summary.overdueTotal}
          danger
        />
        <Summary
          icon={CalendarCheck}
          label="Dnes"
          value={summary.dueTodayTotal}
        />
        <Summary
          icon={Wrench}
          label="Během 7 dní"
          value={summary.dueWithinSevenDaysTotal}
        />
        <Summary
          icon={Wrench}
          label="Během 30 dní"
          value={summary.dueWithinThirtyDaysTotal}
        />
        <Summary
          icon={PauseCircle}
          label="Pozastavené"
          value={summary.pausedTotal}
        />
      </section>
      <section className="rounded-lg border border-border bg-surface-raised p-5">
        <h2 className="text-section-title font-semibold">Nejbližší údržba</h2>
        {dashboard.data.items.length === 0 ? (
          <EmptyState
            compact
            title="Žádná nadcházející údržba"
            description="Po vytvoření plánu se zde zobrazí konkrétní termíny."
          />
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {dashboard.data.items.map((item) => (
              <li
                key={item.id}
                className="flex min-h-14 items-center justify-between gap-4 py-2"
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
                  {formatMaintenanceDate(item.nextDueOn)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {dashboard.data.recentlyCompleted ? (
        <section className="rounded-lg border border-border bg-surface-raised p-5">
          <h2 className="text-body font-semibold">Naposledy dokončeno</h2>
          <p className="mt-2">
            {dashboard.data.recentlyCompleted.title} ·{' '}
            {formatMaintenanceDate(
              dashboard.data.recentlyCompleted.completedOn,
            )}
          </p>
        </section>
      ) : null}
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  danger = false,
}: {
  icon: typeof Wrench;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <Icon className="size-5 text-text-muted" aria-hidden="true" />
      <p className="mt-3 text-caption text-text-muted">{label}</p>
      <strong
        className={`mt-1 block text-section-title ${danger && value ? 'text-danger' : ''}`}
      >
        {value}
      </strong>
    </div>
  );
}
