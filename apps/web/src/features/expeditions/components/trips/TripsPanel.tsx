import { CalendarDays, MapPin, Plus } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useTrips } from '../../hooks/useExpeditions.js';
import {
  TRIP_STATUS_LABELS,
  TRIP_TYPE_LABELS,
} from '../../lib/expeditionLabels.js';

export function TripsPanel({ canWrite }: { canWrite: boolean }) {
  const workspace = useWorkspaceNavigation();
  const trips = useTrips();
  return (
    <section className="grid gap-4" aria-labelledby="trips-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="trips-title" className="text-section-title font-semibold">
            Výpravy
          </h2>
          <p className="text-body-sm text-text-muted">
            Konkrétní seznam je oddělený od šablony a zachovává historické
            snapshoty.
          </p>
        </div>
        {canWrite ? (
          <Button
            variant="primary"
            onClick={() => workspace.openOverlay({ kind: 'trip-create' })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nová výprava
          </Button>
        ) : null}
      </div>
      {trips.isError ? (
        <InlineAlert variant="danger">
          Výpravy se nepodařilo načíst.
          <button
            type="button"
            className="ml-2 min-h-11 underline"
            onClick={() => void trips.refetch()}
          >
            Zkusit znovu
          </button>
        </InlineAlert>
      ) : null}
      {trips.data?.length === 0 ? (
        <EmptyState
          eyebrow={
            <CalendarDays className="mx-auto size-6" aria-hidden="true" />
          }
          title="Žádná plánovaná výprava"
          description="Vytvořte jednodenní výlet nebo trek ze svého gearlistu."
          action={
            canWrite ? (
              <Button
                onClick={() => workspace.openOverlay({ kind: 'trip-create' })}
              >
                Naplánovat výpravu
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {(trips.data ?? []).map((trip) => (
          <button
            key={trip.id}
            type="button"
            className="min-h-11 rounded-lg border border-border bg-surface-raised p-4 text-left transition hover:border-border-strong hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
            onClick={() =>
              workspace.navigate({
                area: 'expeditions',
                screen: 'trip',
                tripId: trip.id,
              })
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{trip.title}</h3>
                <p className="mt-1 text-body-sm text-text-muted">
                  {new Intl.DateTimeFormat('cs-CZ', {
                    dateStyle: 'medium',
                  }).format(new Date(`${trip.startsOn}T12:00:00`))}
                </p>
              </div>
              <Badge variant={trip.status === 'READY' ? 'success' : 'primary'}>
                {TRIP_STATUS_LABELS[trip.status]}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-caption text-text-muted">
              <span>{TRIP_TYPE_LABELS[trip.tripType]}</span>
              {trip.locationLabel ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {trip.locationLabel}
                </span>
              ) : null}
              <span>{trip.items.length} položek</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
