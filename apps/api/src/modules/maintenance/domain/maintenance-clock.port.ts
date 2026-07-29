export const MAINTENANCE_CLOCK = Symbol('MAINTENANCE_CLOCK');

export interface MaintenanceClock {
  now(): Date;
}
