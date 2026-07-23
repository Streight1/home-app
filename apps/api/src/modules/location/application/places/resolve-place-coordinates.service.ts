import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../config/app-config.service.js';
import { routeUnavailable } from '../../domain/location.errors.js';
import type { SavedPlaceRecord } from '../../domain/location.types.js';
import {
  GEOCODING_PROVIDER_PORT,
  type GeocodingProviderPort,
} from '../../domain/ports/geocoding-provider.port.js';

@Injectable()
export class ResolvePlaceCoordinatesService {
  public constructor(
    private readonly config: AppConfigService,
    @Inject(GEOCODING_PROVIDER_PORT)
    private readonly provider: GeocodingProviderPort,
  ) {}

  public async execute(place: SavedPlaceRecord) {
    if (place.provider !== 'MAPY' || !this.config.mapyApiEnabled)
      throw routeUnavailable();
    try {
      const coordinates = await this.provider.resolve({
        query: place.formattedAddress,
        language: this.config.mapyDefaultLanguage,
      });
      if (!coordinates) throw routeUnavailable();
      return coordinates;
    } catch {
      throw routeUnavailable();
    }
  }
}
