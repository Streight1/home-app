import { ArrowLeft, CheckCircle2, ListChecks } from 'lucide-react';
import { useState } from 'react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import {
  useExpeditionMutations,
  useTrip,
  useTripWeightSummary,
} from '../../hooks/useExpeditions.js';
import {
  TRIP_STATUS_LABELS,
  TRIP_TYPE_LABELS,
} from '../../lib/expeditionLabels.js';
import { PackingMode } from '../packing/PackingMode.js';
import { TripPackEditorDialog } from '../packing/TripPackEditorDialog.js';
import { TripWeightSummary } from '../packing/TripWeightSummary.js';
import { TripReviewPanel } from './TripReviewPanel.js';

export function TripDetail({
  tripId,
  canWrite,
}: {
  tripId: string;
  canWrite: boolean;
}) {
  const [editPackOpen, setEditPackOpen] = useState(false);
  const workspace = useWorkspaceNavigation();
  const trip = useTrip(tripId);
  const summary = useTripWeightSummary(tripId);
  const mutations = useExpeditionMutations();
  if (trip.isLoading)
    return <p className="text-body-sm text-text-muted">Načítáme výpravu…</p>;
  if (trip.isError || !trip.data)
    return (
      <InlineAlert variant="danger">Výpravu se nepodařilo načíst.</InlineAlert>
    );
  return (
    <div className="grid gap-6">
      <Button
        className="w-fit"
        onClick={() =>
          workspace.navigate({ area: 'expeditions', screen: 'trips' })
        }
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Zpět na výpravy
      </Button>
      <header className="rounded-lg border border-border bg-surface-raised p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              {TRIP_TYPE_LABELS[trip.data.tripType]}
            </p>
            <h2 className="mt-1 text-page-title font-semibold">
              {trip.data.title}
            </h2>
            <p className="mt-2 text-body-sm text-text-muted">
              {trip.data.startsOn}–{trip.data.endsOn}
              {trip.data.locationLabel ? ` · ${trip.data.locationLabel}` : ''}
            </p>
          </div>
          <Badge variant={trip.data.status === 'READY' ? 'success' : 'primary'}>
            {TRIP_STATUS_LABELS[trip.data.status]}
          </Badge>
        </div>
        {canWrite &&
        trip.data.status !== 'COMPLETED' &&
        summary.data?.readiness.ready ? (
          <Button
            className="mt-4"
            variant="primary"
            loading={mutations.markReady.isPending}
            onClick={() => mutations.markReady.mutate(trip.data.id)}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Označit jako připravenou
          </Button>
        ) : null}
        {canWrite && trip.data.status !== 'COMPLETED' ? (
          <Button className="mt-4 ml-2" onClick={() => setEditPackOpen(true)}>
            <ListChecks className="size-4" aria-hidden="true" />
            Upravit seznam
          </Button>
        ) : null}
        {mutations.markReady.error ? (
          <div className="mt-3">
            <InlineAlert variant="danger">
              {mutations.markReady.error.message}
            </InlineAlert>
          </div>
        ) : null}
      </header>
      <PackingMode trip={trip.data} canWrite={canWrite} />
      <TripWeightSummary tripId={trip.data.id} />
      <TripReviewPanel trip={trip.data} canWrite={canWrite} />
      <TripPackEditorDialog
        trip={trip.data}
        open={editPackOpen}
        onOpenChange={setEditPackOpen}
      />
    </div>
  );
}
