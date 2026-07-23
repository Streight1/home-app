import type { PlaceCoordinates, PlaceSuggestion } from '../location.types.js';

export const GEOCODING_PROVIDER_PORT = Symbol('GEOCODING_PROVIDER_PORT');

export interface GeocodingProviderPort {
  suggest(input: {
    query: string;
    language: string;
    limit: number;
    types: readonly string[];
  }): Promise<PlaceSuggestion[]>;
  resolve(input: {
    query: string;
    language: string;
  }): Promise<PlaceCoordinates | null>;
}
