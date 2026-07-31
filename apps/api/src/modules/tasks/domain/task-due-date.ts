import {
  currentDateOnlyInTimeZone,
  dateOnlyToDatabase,
  isDateOnly,
  serializeNullableDateOnly,
} from '../../../common/time/date-only.js';
import { localDateTimeCandidates } from './zoned-date.js';

export const isIsoDate = isDateOnly;

export function dateOnlyDbValue(value: string): Date {
  return dateOnlyToDatabase(value);
}

export function isoDateFromDb(value: Date | null): string | null {
  return serializeNullableDateOnly(value);
}

export function localIsoDate(value: Date, timezone: string): string {
  return currentDateOnlyInTimeZone(value, timezone);
}

export function dueInstant(
  dueDate: string,
  dueTimeMinutes: number,
  timezone: string,
): Date | null {
  const hours = Math.floor(dueTimeMinutes / 60);
  const minutes = dueTimeMinutes % 60;
  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return localDateTimeCandidates(dueDate, time, timezone)[0] ?? null;
}
