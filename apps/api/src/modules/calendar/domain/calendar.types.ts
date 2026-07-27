import type { RouteMode } from '../../location/domain/location.types.js';

export const calendarEventTypes = [
  'GENERAL',
  'WORK_SHIFT',
  'APPOINTMENT',
  'HOUSEHOLD',
  'PERSONAL',
  'TRAVEL',
  'OTHER',
] as const;
export type CalendarEventType = (typeof calendarEventTypes)[number];

export const calendarColorTokens = [
  'violet',
  'blue',
  'cyan',
  'green',
  'amber',
  'orange',
  'rose',
  'pink',
] as const;
export type CalendarColorToken = (typeof calendarColorTokens)[number];
export const calendarMemberColorTokens = [
  'violet',
  'blue',
  'cyan',
  'green',
  'amber',
  'orange',
  'rose',
  'pink',
] as const;
export type CalendarMemberColorToken =
  (typeof calendarMemberColorTokens)[number];
export type CalendarParticipantRole = 'ASSIGNEE' | 'ATTENDEE';
export type CalendarEventStatus = 'ACTIVE' | 'CANCELLED';
export type CalendarEventSource = 'MANUAL' | 'TEMPLATE' | 'TASK';
export type CalendarVisualColorToken =
  | CalendarColorToken
  | 'neutral'
  | 'shared';
export type CalendarVisualKind = 'EVENT' | 'WORK_SHIFT' | 'TASK';

export interface CalendarEventVisual {
  colorToken: CalendarVisualColorToken;
  backgroundToken: `calendar-${CalendarVisualColorToken}-surface`;
  borderToken: `calendar-${CalendarVisualColorToken}-border`;
  foregroundToken: `calendar-${CalendarVisualColorToken}-foreground`;
  isShared: boolean;
  kind: CalendarVisualKind;
}

export interface CalendarPersonSummary {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  calendarColorToken: CalendarMemberColorToken;
}

export interface CalendarParticipantSummary {
  role: CalendarParticipantRole;
  user: CalendarPersonSummary;
}

export interface CalendarEventRecord {
  id: string;
  householdId: string;
  title: string;
  description: string | null;
  type: CalendarEventType;
  status: CalendarEventStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  allDayStartDate: string | null;
  allDayEndDateExclusive: string | null;
  desiredArrivalAt: Date | null;
  timezone: string;
  isAllDay: boolean;
  location: string | null;
  locationPlaceId: string | null;
  locationLabel: string | null;
  locationNotes: string | null;
  calculateTravel: boolean;
  colorToken: CalendarColorToken | null;
  source: CalendarEventSource;
  templateId: string | null;
  templateApplicationBatchId: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: CalendarParticipantSummary[];
  taskLink: {
    taskId: string;
    status: 'OPEN' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
  } | null;
}

export interface CalendarEventWriteInput {
  title: string;
  description: string | null;
  type: CalendarEventType;
  startsAt: Date | null;
  endsAt: Date | null;
  allDayStartDate: Date | null;
  allDayEndDateExclusive: Date | null;
  desiredArrivalAt: Date | null;
  timezone: string;
  isAllDay: boolean;
  location: string | null;
  locationPlaceId: string | null;
  locationLabel: string | null;
  locationNotes: string | null;
  calculateTravel: boolean;
  colorToken: CalendarColorToken | null;
  participants: { userId: string; role: CalendarParticipantRole }[];
}

export interface CalendarTemplateRecord {
  id: string;
  householdId: string;
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
  locationPlaceId: string | null;
  locationLabel: string | null;
  calculateTravel: boolean;
  routeMode: RouteMode;
  travelBufferMinutes: number;
  colorToken: CalendarColorToken;
  createdAt: Date;
  updatedAt: Date;
  participants: { userId: string; role: CalendarParticipantRole }[];
}

export interface CalendarTemplateWriteInput {
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
  locationPlaceId: string | null;
  locationLabel: string | null;
  calculateTravel: boolean;
  routeMode: RouteMode;
  travelBufferMinutes: number;
  colorToken: CalendarColorToken;
  participants: { userId: string; role: CalendarParticipantRole }[];
}
