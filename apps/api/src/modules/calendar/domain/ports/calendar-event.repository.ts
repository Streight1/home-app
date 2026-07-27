import type {
  CalendarColorToken,
  CalendarEventRecord,
  CalendarEventType,
  CalendarEventWriteInput,
} from '../calendar.types.js';
import type { RouteMode } from '../../../location/domain/location.types.js';

export const CALENDAR_EVENT_REPOSITORY = Symbol('CALENDAR_EVENT_REPOSITORY');

export interface CalendarEventRepository {
  findById(
    householdId: string,
    eventId: string,
  ): Promise<CalendarEventRecord | null>;
  findManyByIds(
    householdId: string,
    eventIds: string[],
  ): Promise<CalendarEventRecord[]>;
  list(
    householdId: string,
    from: Date,
    to: Date,
  ): Promise<CalendarEventRecord[]>;
  create(input: {
    householdId: string;
    userId: string;
    event: CalendarEventWriteInput;
  }): Promise<CalendarEventRecord>;
  createTaskLinked(input: {
    householdId: string;
    userId: string;
    taskId: string;
    event: CalendarEventWriteInput;
  }): Promise<CalendarEventRecord>;
  removeTaskLinked(input: {
    householdId: string;
    userId: string;
    taskId: string;
    calendarEventId: string;
    removedAt: Date;
  }): Promise<boolean>;
  update(input: {
    householdId: string;
    userId: string;
    eventId: string;
    event: CalendarEventWriteInput;
    changedFields: string[];
  }): Promise<CalendarEventRecord | null>;
  cancel(input: {
    householdId: string;
    userId: string;
    eventId: string;
    now: Date;
  }): Promise<CalendarEventRecord | null>;
  delete(input: {
    householdId: string;
    userId: string;
    eventId: string;
    deletedAt: Date;
  }): Promise<boolean>;
  bulkUpdate(input: {
    householdId: string;
    userId: string;
    eventIds: string[];
    colorToken?: CalendarColorToken | null;
    eventType?: CalendarEventType;
    participants?: {
      operation: 'ADD' | 'REMOVE' | 'REPLACE';
      userIds: string[];
    };
    location?: {
      placeId: string | null;
      label: string | null;
    };
    calculateTravel?: boolean;
    routeMode?: RouteMode;
    travelBufferMinutes?: number;
    changedFields: string[];
  }): Promise<number>;
  bulkDelete(input: {
    householdId: string;
    userId: string;
    eventIds: string[];
    deletedAt: Date;
    taskEventCount: number;
    templateEventCount: number;
  }): Promise<number>;
  countShiftConflicts(input: {
    householdId: string;
    participantIds: string[];
    startsAt: Date;
    endsAt: Date;
    excludeEventId?: string;
  }): Promise<number>;
  today(
    householdId: string,
    start: Date,
    end: Date,
    limit: number,
  ): Promise<CalendarEventRecord[]>;
}
