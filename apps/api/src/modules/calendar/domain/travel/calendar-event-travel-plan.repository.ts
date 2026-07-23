import type {
  RouteMode,
  TravelOriginMode,
} from '../../../location/domain/location.types.js';
import type { CalendarEventTravelPlanRecord } from './travel-plan.types.js';

export const CALENDAR_TRAVEL_PLAN_REPOSITORY = Symbol(
  'CALENDAR_TRAVEL_PLAN_REPOSITORY',
);

export interface CalendarEventTravelPlanRepository {
  find(
    householdId: string,
    eventId: string,
    travelerUserId: string,
  ): Promise<CalendarEventTravelPlanRecord | null>;
  listForEvent(
    householdId: string,
    eventId: string,
  ): Promise<CalendarEventTravelPlanRecord[]>;
  listForEvents(
    householdId: string,
    eventIds: readonly string[],
    travelerUserId: string,
  ): Promise<CalendarEventTravelPlanRecord[]>;
  upsertConfiguration(input: {
    householdId: string;
    eventId: string;
    travelerUserId: string;
    userId: string;
    originMode: TravelOriginMode;
    originPlaceId: string | null;
    previousEventId: string | null;
    destinationPlaceId: string;
    routeMode: RouteMode;
    avoidTolls: boolean;
    avoidHighways: boolean;
    travelBufferMinutes: number;
  }): Promise<CalendarEventTravelPlanRecord>;
  markEventPlansStale(householdId: string, eventId: string): Promise<void>;
  markDependentPlansStale(
    householdId: string,
    previousEventId: string,
  ): Promise<void>;
}
