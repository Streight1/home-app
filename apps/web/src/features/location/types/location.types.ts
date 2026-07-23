export type RouteMode =
  | 'CAR_FAST_TRAFFIC'
  | 'CAR_FAST'
  | 'CAR_SHORT'
  | 'FOOT_FAST'
  | 'BICYCLE_ROAD'
  | 'BICYCLE_MOUNTAIN';
export type CalendarViewPreference = 'MONTH' | 'WEEK' | 'DAY' | 'AGENDA';
export type CalendarLayoutMode = 'compact' | 'medium' | 'expanded';

export interface PlaceSuggestion {
  providerPlaceId: string | null;
  primaryLabel: string;
  secondaryLabel: string | null;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeType: string;
}
export interface SavedPlace {
  id: string;
  visibility: 'PRIVATE' | 'HOUSEHOLD';
  label: string;
  formattedAddress: string;
  provider: 'MAPY' | 'MANUAL';
  routable: boolean;
  placeType: string;
}
export interface CalendarPreferences {
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
  lastWorkShiftParticipantUserId: string | null;
}
