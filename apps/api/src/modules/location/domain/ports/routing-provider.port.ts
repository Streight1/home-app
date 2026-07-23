import type {
  PlaceCoordinates,
  RouteEstimate,
  RouteMode,
} from '../location.types.js';

export const ROUTING_PROVIDER_PORT = Symbol('ROUTING_PROVIDER_PORT');

export interface RoutingProviderPort {
  calculate(input: {
    start: PlaceCoordinates;
    end: PlaceCoordinates;
    routeMode: RouteMode;
    avoidTolls: boolean;
    avoidHighways: boolean;
    departureAt: Date;
  }): Promise<RouteEstimate>;
}
