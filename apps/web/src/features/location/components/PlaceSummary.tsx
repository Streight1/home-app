import { MapPin, ShieldAlert } from 'lucide-react';
import type { SavedPlace } from '../types/location.types.js';

export function PlaceSummary({
  place,
}: {
  place: Pick<SavedPlace, 'label' | 'formattedAddress' | 'routable'>;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-surface-subtle p-3">
      <MapPin
        className="mt-0.5 size-4 shrink-0 text-primary-emphasis"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-medium text-text">{place.label}</p>
        <p className="break-words text-caption text-text-muted">
          {place.formattedAddress}
        </p>
        {!place.routable ? (
          <p className="mt-1 flex items-center gap-1 text-caption text-warning">
            <ShieldAlert className="size-3.5" aria-hidden="true" />
            Neověřené místo – routing není dostupný
          </p>
        ) : null}
      </div>
    </div>
  );
}
