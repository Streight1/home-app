export const SCHEDULING_CLOCK_PORT = Symbol('SCHEDULING_CLOCK_PORT');

export interface SchedulingClockPort {
  now(): Date;
}
