import type { SavedPlace } from '../types/location.types.js';
import { PlaceSummary } from './PlaceSummary.js';

export function SelectedPlaceSummary({
  place,
}: {
  place: Pick<SavedPlace, 'label' | 'formattedAddress' | 'routable'>;
}) {
  return <PlaceSummary place={place} />;
}
