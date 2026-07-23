import { Injectable } from '@nestjs/common';
import type { GeocodingProviderPort } from '../../../domain/ports/geocoding-provider.port.js';
import { MapyApiClient } from './mapy-api.client.js';
import { mapMapySuggestions } from './mapy-response.mapper.js';

@Injectable()
export class MapyGeocodingAdapter implements GeocodingProviderPort {
  public constructor(private readonly client: MapyApiClient) {}
  public async suggest(input: Parameters<GeocodingProviderPort['suggest']>[0]) {
    const query = new URLSearchParams({
      query: input.query,
      lang: input.language,
      limit: String(input.limit),
    });
    for (const type of input.types) query.append('type', type);
    return mapMapySuggestions(await this.client.get('/v1/suggest', query));
  }
  public async resolve(input: Parameters<GeocodingProviderPort['resolve']>[0]) {
    const query = new URLSearchParams({
      query: input.query,
      lang: input.language,
      limit: '1',
    });
    const [result] = mapMapySuggestions(
      await this.client.get('/v1/geocode', query),
    );
    return result
      ? { latitude: result.latitude, longitude: result.longitude }
      : null;
  }
}
