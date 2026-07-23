import { Inject, Injectable } from '@nestjs/common';
import {
  SAVED_PLACE_REPOSITORY,
  type SavedPlaceRepository,
} from './domain/ports/saved-place.repository.js';

export interface AccessiblePlaceSummary {
  id: string;
  label: string;
  formattedAddress: string;
  routable: boolean;
}

@Injectable()
export class LocationFacade {
  public constructor(
    @Inject(SAVED_PLACE_REPOSITORY)
    private readonly places: SavedPlaceRepository,
  ) {}

  public async findAccessiblePlace(
    householdId: string,
    userId: string,
    placeId: string,
  ): Promise<AccessiblePlaceSummary | null> {
    const place = await this.places.findVisible(householdId, userId, placeId);
    return place
      ? {
          id: place.id,
          label: place.label,
          formattedAddress: place.formattedAddress,
          routable: place.provider !== 'MANUAL',
        }
      : null;
  }
}
