import type {
  RouteMode,
  TravelOriginMode,
} from '../../../location/domain/location.types.js';

export type TravelPlanStatus =
  | 'NOT_CALCULATED'
  | 'CALCULATING'
  | 'READY'
  | 'STALE'
  | 'FAILED'
  | 'UNAVAILABLE';

export interface CalendarEventTravelPlanRecord {
  id: string;
  householdId: string;
  eventId: string;
  travelerUserId: string;
  originMode: TravelOriginMode;
  originPlaceId: string | null;
  previousEventId: string | null;
  destinationPlaceId: string;
  routeMode: RouteMode;
  avoidTolls: boolean;
  avoidHighways: boolean;
  travelBufferMinutes: number;
  status: TravelPlanStatus;
}

export interface TransientTravelEstimate {
  distanceMeters: number;
  durationSeconds: number;
  departureAt: Date;
  originSource: 'DEFAULT_PLACE' | 'PREVIOUS_EVENT' | 'CUSTOM_PLACE';
  originEventTitle: string | null;
}
