import { ArrowRight, Backpack, Mountain, Plus } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useExpeditionsDashboard } from '../../hooks/useExpeditions.js';
import {
  formatWeight,
  TRIP_STATUS_LABELS,
} from '../../lib/expeditionLabels.js';

export function ExpeditionsDashboardWidget({
  canWrite = true,
}: {
  canWrite?: boolean;
}) {
  const workspace = useWorkspaceNavigation();
  const dashboard = useExpeditionsDashboard();
  const nextTrip = dashboard.data?.nextTrip;
  return (
    <section
      className="md:col-span-12"
      aria-labelledby="expeditions-dashboard-title"
    >
      <div className="rounded-lg border border-border bg-surface-raised p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              Trekking a příprava
            </p>
            <h2
              id="expeditions-dashboard-title"
              className="mt-1 text-section-title font-semibold"
            >
              Příští výprava
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite ? (
              <Button
                variant="primary"
                onClick={() => workspace.openOverlay({ kind: 'trip-create' })}
              >
                <Plus className="size-4" aria-hidden="true" />
                Nová výprava
              </Button>
            ) : null}
            <Button
              onClick={() =>
                workspace.navigate({
                  area: 'expeditions',
                  screen: 'overview',
                })
              }
            >
              Zobrazit výpravy
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        {dashboard.isLoading ? (
          <p className="mt-4 text-body-sm text-text-muted">
            Načítáme přípravu…
          </p>
        ) : null}
        {dashboard.isError ? (
          <div className="mt-4">
            <InlineAlert variant="danger">
              Přehled výprav se nepodařilo načíst.
              <button
                type="button"
                className="ml-2 min-h-11 underline"
                onClick={() => void dashboard.refetch()}
              >
                Zkusit znovu
              </button>
            </InlineAlert>
          </div>
        ) : null}
        {nextTrip ? (
          <article className="mt-4 rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Mountain
                    className="size-5 text-primary-emphasis"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold">{nextTrip.title}</h3>
                </div>
                <p className="mt-1 text-body-sm text-text-muted">
                  {nextTrip.startsOn} · {nextTrip.packedCount} z{' '}
                  {nextTrip.totalCount} položek sbaleno
                </p>
              </div>
              <Badge
                variant={nextTrip.status === 'READY' ? 'success' : 'primary'}
              >
                {TRIP_STATUS_LABELS[nextTrip.status]}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-body-sm">
              <span>
                Base weight:{' '}
                <strong>{formatWeight(nextTrip.baseWeightGrams)}</strong>
              </span>
              <span>
                Chybí povinné: <strong>{nextTrip.missingRequiredCount}</strong>
              </span>
              <Button
                onClick={() =>
                  workspace.navigate({
                    area: 'expeditions',
                    screen: 'trip',
                    tripId: nextTrip.id,
                  })
                }
              >
                Pokračovat v balení
              </Button>
            </div>
          </article>
        ) : null}
        {dashboard.data && !dashboard.data.nextTrip ? (
          <div className="mt-4">
            <EmptyState
              compact
              eyebrow={
                <Backpack className="mx-auto size-5" aria-hidden="true" />
              }
              title="Žádná budoucí výprava"
              description="Přehled je skutečně prázdný. Katalog výbavy a gearlisty zůstávají dostupné."
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
