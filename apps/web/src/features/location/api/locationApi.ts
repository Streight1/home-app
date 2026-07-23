import { apiRequest } from '../../../lib/api/apiClient.js';
import type { PlaceSuggestion, SavedPlace } from '../types/location.types.js';

export function suggestPlaces(query: string, signal?: AbortSignal) {
  const parameters = new URLSearchParams({
    query,
    types: 'regional.address,regional.municipality,poi',
  });
  return apiRequest<{ items: PlaceSuggestion[] }>(
    `/locations/suggest?${parameters}`,
    signal ? { signal } : {},
  );
}
export function getSavedPlaces() {
  return apiRequest<{ items: SavedPlace[] }>('/locations/places');
}
export function createSavedPlace(input: {
  visibility: 'PRIVATE' | 'HOUSEHOLD';
  label: string;
  formattedAddress: string;
  provider: 'MAPY' | 'MANUAL';
  placeType: string;
}) {
  return apiRequest<SavedPlace>('/locations/places', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
