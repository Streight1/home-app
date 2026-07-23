import type {
  CalendarEventRecord,
  CalendarEventWriteInput,
} from '../calendar.types.js';

export const CALENDAR_EVENT_REPOSITORY = Symbol('CALENDAR_EVENT_REPOSITORY');

export interface CalendarEventRepository {
  findById(
    householdId: string,
    eventId: string,
  ): Promise<CalendarEventRecord | null>;
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
