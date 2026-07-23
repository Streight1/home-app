import type { SavedPlaceRecord } from '../location.types.js';

export const SAVED_PLACE_REPOSITORY = Symbol('SAVED_PLACE_REPOSITORY');

export interface SavedPlaceRepository {
  listVisible(householdId: string, userId: string): Promise<SavedPlaceRecord[]>;
  findVisible(
    householdId: string,
    userId: string,
    placeId: string,
  ): Promise<SavedPlaceRecord | null>;
  findInHousehold(
    householdId: string,
    placeId: string,
  ): Promise<SavedPlaceRecord | null>;
  findForOwner(
    householdId: string,
    ownerUserId: string,
    placeId: string,
  ): Promise<SavedPlaceRecord | null>;
  create(input: {
    householdId: string;
    userId: string;
    visibility: 'PRIVATE' | 'HOUSEHOLD';
    label: string;
    formattedAddress: string;
    provider: 'MAPY' | 'MANUAL';
    placeType: string;
  }): Promise<SavedPlaceRecord>;
}
