export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';
export type CalendarEventType =
  | 'GENERAL'
  | 'WORK_SHIFT'
  | 'APPOINTMENT'
  | 'HOUSEHOLD'
  | 'PERSONAL'
  | 'TRAVEL'
  | 'OTHER';
export type CalendarColorToken =
  | 'primary'
  | 'blue'
  | 'cyan'
  | 'success'
  | 'warning'
  | 'danger';

export interface CalendarPerson {
  id: string;
  email?: string;
  displayName: string | null;
  avatarUrl: string | null;
  calendarColorToken?: CalendarMemberColorToken;
}
export type CalendarMemberColorToken =
  | 'violet'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'pink';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  type: CalendarEventType;
  status: 'ACTIVE' | 'CANCELLED';
  startsAt: string;
  endsAt: string;
  timezone: string;
  isAllDay: boolean;
  location: string | null;
  locationPlaceId: string | null;
  locationLabel: string | null;
  locationNotes: string | null;
  calculateTravel?: boolean;
  colorToken: CalendarColorToken;
  source: 'MANUAL' | 'TEMPLATE' | 'TASK';
  templateId: string | null;
  participants: { role: 'ASSIGNEE' | 'ATTENDEE'; user: CalendarPerson }[];
  visual?: {
    colorToken: CalendarMemberColorToken | 'shared' | 'neutral';
    isShared: boolean;
  };
  spansMidnight: boolean;
  taskLink: {
    taskId: string;
    status: 'OPEN' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
  } | null;
  permissions: {
    canEdit: boolean;
    canCancel: boolean;
    canDelete: boolean;
    canCompleteTask: boolean;
  };
}

export interface AgendaCalendarItem {
  sourceType: 'TASK';
  id: string;
  title: string;
  start: string;
  end: null;
  status: string;
  priority: string;
  isAllDay: boolean;
  canComplete: boolean;
  navigationTarget: { area: 'tasks'; screen: 'detail'; taskId: string };
}

export interface EventCalendarItem {
  sourceType: 'CALENDAR_EVENT';
  id: string;
  title: string;
  start: string;
  end: string;
  status: 'ACTIVE' | 'CANCELLED';
  eventType: CalendarEventType;
  colorToken:
    | CalendarMemberColorToken
    | CalendarColorToken
    | 'shared'
    | 'neutral';
  visual?: {
    colorToken: CalendarMemberColorToken | 'shared' | 'neutral';
    isShared: boolean;
  };
  isAllDay: boolean;
  participants: CalendarPerson[];
  locationLabel?: string | null;
  taskLink: {
    taskId: string;
    status: 'OPEN' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
    canComplete: boolean;
  } | null;
  navigationTarget: { area: 'calendar'; screen: 'detail'; eventId: string };
}

export interface TravelCalendarItem {
  sourceType: 'TRAVEL_BLOCK';
  id: string;
  eventId: string;
  travelerUserId?: string;
  title: string;
  eventTitle: string;
  start: string;
  end: string;
  eventStartsAt: string;
  status: string;
  routeMode: string;
  durationSeconds: number;
  distanceMeters: number;
  bufferMinutes: number;
  hasConflict: boolean;
  missingSeconds: number;
  traveler: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  navigationTarget: { area: 'calendar'; screen: 'detail'; eventId: string };
}

export type CalendarFeedItem =
  | AgendaCalendarItem
  | EventCalendarItem
  | TravelCalendarItem;

export interface TravelPlanInput {
  travelerUserId: string;
  originMode: 'AUTO' | 'DEFAULT_PLACE' | 'PREVIOUS_EVENT' | 'CUSTOM_PLACE';
  originPlaceId?: string | null;
  previousEventId?: string | null;
  routeMode:
    | 'CAR_FAST_TRAFFIC'
    | 'CAR_FAST'
    | 'CAR_SHORT'
    | 'FOOT_FAST'
    | 'BICYCLE_ROAD'
    | 'BICYCLE_MOUNTAIN';
  avoidTolls: boolean;
  avoidHighways: boolean;
  travelBufferMinutes: number;
  allowTravelConflict?: boolean;
}

export interface TravelPlan extends TravelPlanInput {
  id: string;
  eventId: string;
  distanceMeters: number | null;
  durationSeconds: number | null;
  departureAt: string | null;
  status:
    | 'NOT_CALCULATED'
    | 'CALCULATING'
    | 'READY'
    | 'STALE'
    | 'FAILED'
    | 'UNAVAILABLE';
  conflict: {
    hasConflict: boolean;
    availableTransferSeconds: number | null;
    requiredTransferSeconds: number;
    missingSeconds: number;
  };
  origin?: {
    source: 'DEFAULT_PLACE' | 'PREVIOUS_EVENT' | 'CUSTOM_PLACE';
    eventTitle: string | null;
  } | null;
}

export interface CalendarEventInput {
  title: string;
  description: string | null;
  type: CalendarEventType;
  startsAt: string;
  endsAt: string;
  timezone: string;
  isAllDay: boolean;
  location: string | null;
  locationPlaceId: string | null;
  locationLabel: string | null;
  locationNotes: string | null;
  calculateTravel: boolean;
  colorToken: CalendarColorToken;
  participantIds: string[];
  allowShiftConflict?: boolean;
  travelPlan?: TravelPlanInput;
}

export interface CalendarTemplate {
  id: string;
  name: string;
  title: string;
  description: string | null;
  eventType: CalendarEventType;
  startLocalTime: string;
  endLocalTime: string;
  endDayOffset: number;
  timezone: string;
  isAllDay: boolean;
  defaultLocation: string | null;
  locationPlaceId?: string | null;
  locationLabel?: string | null;
  calculateTravel?: boolean;
  routeMode?: TravelPlanInput['routeMode'];
  travelBufferMinutes?: number;
  colorToken: CalendarColorToken;
  participantIds: string[];
}

export type CalendarTemplateInput = Omit<CalendarTemplate, 'id'>;

export interface CalendarDashboard {
  summary: { total: number; ongoingTotal: number };
  items: {
    id: string;
    title: string;
    type: CalendarEventType;
    startsAt: string;
    endsAt: string;
    timezone: string;
    isAllDay: boolean;
    colorToken: CalendarColorToken;
    isOngoing: boolean;
    spansMidnight: boolean;
    participants: CalendarPerson[];
    locationLabel: string | null;
    visual: {
      colorToken: CalendarMemberColorToken | 'shared' | 'neutral';
      isShared: boolean;
    };
    travelPlans: {
      travelerUserId: string;
      status: TravelPlan['status'];
      routeMode: TravelPlanInput['routeMode'];
      departureAt: string | null;
      durationSeconds: number | null;
      distanceMeters: number | null;
      hasConflict: boolean;
      missingSeconds: number;
      origin: TravelPlan['origin'];
      canRecalculate: boolean;
    }[];
    navigationTarget: { area: 'calendar'; screen: 'detail'; eventId: string };
  }[];
}

export interface TravelEstimatePreview {
  items: {
    travelerUserId: string;
    status: 'READY' | 'FAILED' | 'UNAVAILABLE';
    durationSeconds: number | null;
    distanceMeters: number | null;
    departureAt: string | null;
    origin: TravelPlan['origin'];
    conflict: { hasConflict: boolean; missingSeconds: number };
  }[];
  provider: 'MAPY';
  persisted: false;
}
