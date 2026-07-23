import { getZonedParts, localDateTimeCandidates } from './zoned-date.js';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return (
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() + 1 === Number(match[2]) &&
    date.getUTCDate() === Number(match[3])
  );
}

export function dateOnlyDbValue(value: string): Date {
  if (!isIsoDate(value)) throw new Error('INVALID_ISO_DATE');
  return new Date(`${value}T00:00:00.000Z`);
}

export function isoDateFromDb(value: Date | null): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}

export function localIsoDate(value: Date, timezone: string): string {
  const parts = getZonedParts(value, timezone);
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
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
