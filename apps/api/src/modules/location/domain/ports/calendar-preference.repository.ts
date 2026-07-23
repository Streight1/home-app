import type { CalendarPreferenceRecord } from '../location.types.js';

export const CALENDAR_PREFERENCE_REPOSITORY = Symbol(
  'CALENDAR_PREFERENCE_REPOSITORY',
);

export interface CalendarPreferenceRepository {
  getOrCreate(
    householdId: string,
    userId: string,
  ): Promise<CalendarPreferenceRecord>;
  update(input: {
    householdId: string;
    userId: string;
    patch: Partial<Omit<CalendarPreferenceRecord, 'householdId' | 'userId'>>;
  }): Promise<CalendarPreferenceRecord>;
}
