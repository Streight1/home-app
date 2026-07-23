export const CALENDAR_CLOCK_PORT = Symbol('CALENDAR_CLOCK_PORT');
export interface CalendarClockPort {
  now(): Date;
}
