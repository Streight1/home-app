import { Module } from '@nestjs/common';
import { HouseholdsModule } from '../households/households.module.js';
import { SuggestPlacesService } from './application/places/suggest-places.service.js';
import { SavedPlacesService } from './application/places/saved-places.service.js';
import { ResolvePlaceCoordinatesService } from './application/places/resolve-place-coordinates.service.js';
import { CalendarPreferencesService } from './application/preferences/calendar-preferences.service.js';
import { CalculateRouteEstimateService } from './application/routing/calculate-route-estimate.service.js';
import { CALENDAR_PREFERENCE_REPOSITORY } from './domain/ports/calendar-preference.repository.js';
import { GEOCODING_PROVIDER_PORT } from './domain/ports/geocoding-provider.port.js';
import { ROUTING_PROVIDER_PORT } from './domain/ports/routing-provider.port.js';
import { SAVED_PLACE_REPOSITORY } from './domain/ports/saved-place.repository.js';
import { PrismaCalendarPreferenceRepository } from './infrastructure/prisma-calendar-preference.repository.js';
import { PrismaSavedPlaceRepository } from './infrastructure/prisma-saved-place.repository.js';
import { MapyApiClient } from './infrastructure/providers/mapy/mapy-api.client.js';
import { MapyGeocodingAdapter } from './infrastructure/providers/mapy/mapy-geocoding.adapter.js';
import { MapyRoutingAdapter } from './infrastructure/providers/mapy/mapy-routing.adapter.js';
import { CalendarPreferencesController } from './presentation/calendar-preferences.controller.js';
import { LocationSuggestController } from './presentation/location-suggest.controller.js';
import { SavedPlacesController } from './presentation/saved-places.controller.js';
import { LocationFacade } from './location.facade.js';
import { TravelEstimationFacade } from './travel-estimation.facade.js';

@Module({
  imports: [HouseholdsModule],
  controllers: [
    LocationSuggestController,
    SavedPlacesController,
    CalendarPreferencesController,
  ],
  providers: [
    MapyApiClient,
    MapyGeocodingAdapter,
    MapyRoutingAdapter,
    { provide: GEOCODING_PROVIDER_PORT, useExisting: MapyGeocodingAdapter },
    { provide: ROUTING_PROVIDER_PORT, useExisting: MapyRoutingAdapter },
    PrismaSavedPlaceRepository,
    {
      provide: SAVED_PLACE_REPOSITORY,
      useExisting: PrismaSavedPlaceRepository,
    },
    PrismaCalendarPreferenceRepository,
    {
      provide: CALENDAR_PREFERENCE_REPOSITORY,
      useExisting: PrismaCalendarPreferenceRepository,
    },
    SuggestPlacesService,
    SavedPlacesService,
    ResolvePlaceCoordinatesService,
    CalendarPreferencesService,
    CalculateRouteEstimateService,
    LocationFacade,
    TravelEstimationFacade,
  ],
  exports: [
    SAVED_PLACE_REPOSITORY,
    CALENDAR_PREFERENCE_REPOSITORY,
    CalendarPreferencesService,
    CalculateRouteEstimateService,
    ResolvePlaceCoordinatesService,
    LocationFacade,
    TravelEstimationFacade,
  ],
})
export class LocationModule {}
