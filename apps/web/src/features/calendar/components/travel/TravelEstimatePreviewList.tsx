import { AlertTriangle, Navigation } from 'lucide-react';
import { MapyAttribution } from '../../../location/components/MapyAttribution.js';
import type { HouseholdMemberSummary } from '../../../household/household.public.js';
import type { TravelEstimatePreview } from '../../types/calendar.types.js';

const durationLabel = (seconds: number) => {
  const minutes = Math.ceil(seconds / 60);
  return minutes < 60
    ? `${String(minutes)} min`
    : `${String(Math.floor(minutes / 60))} h ${String(minutes % 60)} min`;
};

export function TravelEstimatePreviewList({
  preview,
  members,
  loading,
}: {
  preview?: TravelEstimatePreview | undefined;
  members: HouseholdMemberSummary[];
  loading: boolean;
}) {
  if (loading)
    return (
      <p className="text-body-sm text-text-muted" role="status">
        Počítáme cestu…
      </p>
    );
  if (!preview) return null;
  return (
    <div className="grid gap-2" aria-live="polite">
      {preview.items.map((item) => {
        const member = members.find(({ id }) => id === item.travelerUserId);
        const name = member?.displayName ?? member?.email ?? 'Člen domácnosti';
        if (item.status !== 'READY' || item.durationSeconds === null)
          return (
            <p
              key={item.travelerUserId}
              className="rounded-md border border-border bg-surface-subtle p-3 text-body-sm text-warning"
            >
              {name}: výchozí místo není nastavené nebo trasu nelze vypočítat.
            </p>
          );
        return (
          <div
            key={item.travelerUserId}
            className="rounded-md border border-border bg-surface-subtle p-3 text-body-sm"
          >
            <p className="flex items-center gap-2 font-medium">
              <Navigation className="size-4 text-info" aria-hidden="true" />
              {name}: cesta přibližně {durationLabel(item.durationSeconds)}
            </p>
            <p className="mt-1 text-caption text-text-muted">
              {item.distanceMeters === null
                ? ''
                : `${(item.distanceMeters / 1000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} km · `}
              {item.departureAt
                ? `odjezd přibližně v ${new Date(item.departureAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </p>
            <p className="mt-1 text-caption text-text-muted">
              {item.origin?.source === 'PREVIOUS_EVENT'
                ? `Start: předchozí událost${item.origin.eventTitle ? ` – ${item.origin.eventTitle}` : ''}`
                : item.origin?.source === 'CUSTOM_PLACE'
                  ? 'Start: vlastní místo'
                  : 'Start: výchozí místo'}
            </p>
            {item.conflict.hasConflict ? (
              <p className="mt-2 flex gap-1 text-caption font-medium text-danger">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                Na přesun chybí přibližně{' '}
                {durationLabel(item.conflict.missingSeconds)}. Konflikt potvrďte
                před uložením.
              </p>
            ) : null}
          </div>
        );
      })}
      <MapyAttribution context="Odhad cesty" />
    </div>
  );
}
