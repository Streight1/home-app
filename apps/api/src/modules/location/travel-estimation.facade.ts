import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../households/household-access.service.js';
import { CalculateRouteEstimateService } from './application/routing/calculate-route-estimate.service.js';
import { ResolvePlaceCoordinatesService } from './application/places/resolve-place-coordinates.service.js';
import {
  SAVED_PLACE_REPOSITORY,
  type SavedPlaceRepository,
} from './domain/ports/saved-place.repository.js';
import { routeModes, type RouteMode } from './domain/location.types.js';

export const travelRouteModes = routeModes;
export type TravelRouteMode = RouteMode;

@Injectable()
export class TravelEstimationFacade {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(SAVED_PLACE_REPOSITORY)
    private readonly places: SavedPlaceRepository,
    private readonly coordinates: ResolvePlaceCoordinatesService,
    private readonly routes: CalculateRouteEstimateService,
  ) {}

  public async estimateBetweenPlaces(input: {
    userId: string;
    householdId: string;
    originPlaceId: string;
    destinationPlaceId: string;
    routeMode: RouteMode;
    departureAt: Date;
  }) {
    await this.access.assertMembership(input.userId, input.householdId);
    const [origin, destination] = await Promise.all([
      this.places.findInHousehold(input.householdId, input.originPlaceId),
      this.places.findInHousehold(input.householdId, input.destinationPlaceId),
    ]);
    if (!origin || !destination) throw new Error('TRAVEL_PLACE_NOT_FOUND');
    const [originCoordinates, destinationCoordinates] = await Promise.all([
      this.coordinates.execute(origin),
      this.coordinates.execute(destination),
    ]);
    const result = await this.routes.execute({
      start: originCoordinates,
      end: destinationCoordinates,
      routeMode: input.routeMode,
      avoidTolls: false,
      avoidHighways: false,
      departureAt: input.departureAt,
    });
    return {
      durationSeconds: result.durationSeconds,
      distanceMeters: result.distanceMeters,
    };
  }
}
