export const routeModes = [
  'CAR_FAST_TRAFFIC',
  'CAR_FAST',
  'CAR_SHORT',
  'FOOT_FAST',
  'BICYCLE_ROAD',
  'BICYCLE_MOUNTAIN',
] as const;
export type RouteMode = (typeof routeModes)[number];

export const calendarViewPreferences = [
  'MONTH',
  'WEEK',
  'DAY',
  'AGENDA',
] as const;
export type CalendarViewPreference = (typeof calendarViewPreferences)[number];
export type CalendarLayoutMode = 'compact' | 'medium' | 'expanded';
export type TravelOriginMode =
  | 'AUTO'
  | 'DEFAULT_PLACE'
  | 'PREVIOUS_EVENT'
  | 'CUSTOM_PLACE';

export interface PlaceCoordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceSuggestion extends PlaceCoordinates {
  providerPlaceId: string | null;
  primaryLabel: string;
  secondaryLabel: string | null;
  formattedAddress: string;
  placeType: string;
}

export interface SavedPlaceRecord {
  id: string;
  householdId: string;
  ownerUserId: string | null;
  visibility: 'PRIVATE' | 'HOUSEHOLD';
  label: string;
  formattedAddress: string;
  provider: 'MAPY' | 'MANUAL';
  placeType: string;
}

export interface CalendarPreferenceRecord {
  householdId: string;
  userId: string;
  defaultPlaceId: string | null;
  defaultRouteMode: RouteMode;
  defaultTravelBufferMinutes: number;
  avoidTolls: boolean;
  avoidHighways: boolean;
  compactCalendarView: CalendarViewPreference;
  mediumCalendarView: CalendarViewPreference;
  expandedCalendarView: CalendarViewPreference;
  showTravelBlocks: boolean;
  showTravelBlocksInMonth: boolean;
  lastWorkShiftParticipantUserId: string | null;
}

export interface RouteEstimate {
  distanceMeters: number;
  durationSeconds: number;
  providerCalculatedAt: Date;
}
