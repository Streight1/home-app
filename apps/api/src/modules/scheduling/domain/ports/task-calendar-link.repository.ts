export const TASK_CALENDAR_LINK_REPOSITORY = Symbol(
  'TASK_CALENDAR_LINK_REPOSITORY',
);

export interface TaskCalendarLinkRecord {
  id: string;
  householdId: string;
  taskId: string;
  calendarEventId: string;
  createdAt: Date;
}

export interface TaskCalendarLinkRepository {
  findActive(
    householdId: string,
    taskId: string,
  ): Promise<TaskCalendarLinkRecord | null>;
}
