import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  SAVED_PLACE_REPOSITORY,
  type SavedPlaceRepository,
} from '../../domain/ports/saved-place.repository.js';
import type { CreateSavedPlaceDto } from '../../presentation/dto/create-saved-place.dto.js';

@Injectable()
export class SavedPlacesService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(SAVED_PLACE_REPOSITORY)
    private readonly places: SavedPlaceRepository,
  ) {}
  public async list(userId: string) {
    const membership = await this.access.getActiveMembership(userId);
    return {
      items: (
        await this.places.listVisible(membership.householdId, userId)
      ).map(publicPlace),
    };
  }
  public async create(userId: string, input: CreateSavedPlaceDto) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    return publicPlace(
      await this.places.create({
        householdId: membership.householdId,
        userId,
        visibility: input.visibility,
        label: input.label.trim(),
        formattedAddress: input.formattedAddress.trim(),
        provider: input.provider,
        placeType: input.placeType.trim(),
      }),
    );
  }
}

export function publicPlace(
  place: Awaited<ReturnType<SavedPlaceRepository['create']>>,
) {
  return {
    id: place.id,
    visibility: place.visibility,
    label: place.label,
    formattedAddress: place.formattedAddress,
    provider: place.provider,
    routable: place.provider === 'MAPY',
    placeType: place.placeType,
  };
}
