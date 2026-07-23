import { Injectable } from '@nestjs/common';
import type { RouteMode } from '../../../domain/location.types.js';
import type { RoutingProviderPort } from '../../../domain/ports/routing-provider.port.js';
import { MapyApiClient } from './mapy-api.client.js';
import { mapMapyRoute } from './mapy-response.mapper.js';

const routeTypes: Record<RouteMode, string> = {
  CAR_FAST_TRAFFIC: 'car_fast_traffic',
  CAR_FAST: 'car_fast',
  CAR_SHORT: 'car_short',
  FOOT_FAST: 'foot_fast',
  BICYCLE_ROAD: 'bike_road',
  BICYCLE_MOUNTAIN: 'bike_mountain',
};

@Injectable()
export class MapyRoutingAdapter implements RoutingProviderPort {
  public constructor(private readonly client: MapyApiClient) {}
  public async calculate(
    input: Parameters<RoutingProviderPort['calculate']>[0],
  ) {
    const query = new URLSearchParams({
      start: `${String(input.start.longitude)},${String(input.start.latitude)}`,
      end: `${String(input.end.longitude)},${String(input.end.latitude)}`,
      routeType: routeTypes[input.routeMode],
      format: 'geojson',
      avoidToll: String(input.avoidTolls),
      avoidHighways: String(input.avoidHighways),
      departure: input.departureAt.toISOString().slice(0, -1),
    });
    return mapMapyRoute(await this.client.get('/v1/routing/route', query));
  }
}
