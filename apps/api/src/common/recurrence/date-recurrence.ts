import { addIsoDateDays, daysInMonth } from '../time/zoned-date.js';

export type DateRecurrenceFrequency =
  | 'ONCE'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'YEARLY'
  | 'CUSTOM_MONTHS';

export interface DateRecurrenceDefinition {
  frequency: DateRecurrenceFrequency;
  interval: number;
  weekdays?: readonly number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  months?: readonly number[];
  ordinal?: 1 | 2 | 3 | 4 | 5 | -1;
  weekday?: number;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: string): DateParts {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error('INVALID_ISO_DATE');
  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  if (
    parts.month < 1 ||
    parts.month > 12 ||
    parts.day < 1 ||
    parts.day > daysInMonth(parts.year, parts.month)
  )
    throw new Error('INVALID_ISO_DATE');
  return parts;
}

export function formatIsoDate(parts: DateParts): string {
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function isoDateWeekday(value: string): number {
  const parts = parseIsoDate(value);
  const weekday = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day),
  ).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

function epochDay(value: string): number {
  const parts = parseIsoDate(value);
  return Math.floor(
    Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000,
  );
}

function mondayEpochDay(value: string): number {
  return epochDay(value) - (isoDateWeekday(value) - 1);
}

function selectedDay(
  year: number,
  month: number,
  definition: DateRecurrenceDefinition,
  fallbackDay: number,
): number {
  if (definition.ordinal !== undefined && definition.weekday !== undefined) {
    if (definition.ordinal === -1) {
      const last = daysInMonth(year, month);
      const lastWeekday = isoDateWeekday(
        formatIsoDate({ year, month, day: last }),
      );
      return last - ((lastWeekday - definition.weekday + 7) % 7);
    }
    const firstWeekday = isoDateWeekday(formatIsoDate({ year, month, day: 1 }));
    const result =
      1 +
      ((definition.weekday - firstWeekday + 7) % 7) +
      (definition.ordinal - 1) * 7;
    return Math.min(result, daysInMonth(year, month));
  }
  return Math.min(
    definition.dayOfMonth ?? fallbackDay,
    daysInMonth(year, month),
  );
}

function matches(
  candidate: string,
  anchor: string,
  definition: DateRecurrenceDefinition,
): boolean {
  const current = parseIsoDate(candidate);
  const start = parseIsoDate(anchor);
  const interval = Math.max(1, definition.interval);
  if (definition.frequency === 'DAILY')
    return (epochDay(candidate) - epochDay(anchor)) % interval === 0;
  if (definition.frequency === 'WEEKLY') {
    const weekDifference =
      (mondayEpochDay(candidate) - mondayEpochDay(anchor)) / 7;
    const weekdays = definition.weekdays?.length
      ? definition.weekdays
      : [isoDateWeekday(anchor)];
    return (
      weekDifference >= 0 &&
      weekDifference % interval === 0 &&
      weekdays.includes(isoDateWeekday(candidate))
    );
  }
  const monthDifference =
    (current.year - start.year) * 12 + current.month - start.month;
  if (definition.frequency === 'MONTHLY')
    return (
      monthDifference >= 0 &&
      monthDifference % interval === 0 &&
      current.day ===
        selectedDay(current.year, current.month, definition, start.day)
    );
  if (definition.frequency === 'CUSTOM_MONTHS')
    return (
      (definition.months ?? []).includes(current.month) &&
      current.day ===
        selectedDay(current.year, current.month, definition, start.day)
    );
  if (definition.frequency === 'YEARLY') {
    const targetMonth = definition.monthOfYear ?? start.month;
    return (
      current.year >= start.year &&
      (current.year - start.year) % interval === 0 &&
      current.month === targetMonth &&
      current.day ===
        selectedDay(current.year, current.month, definition, start.day)
    );
  }
  return false;
}

export function calculateNextDateOccurrence(input: {
  currentDate: string;
  anchorDate: string;
  definition: DateRecurrenceDefinition;
  endsOn?: string | null;
}): string | null {
  if (input.definition.frequency === 'ONCE') return null;
  parseIsoDate(input.currentDate);
  parseIsoDate(input.anchorDate);
  if (input.endsOn) parseIsoDate(input.endsOn);
  let candidate = input.currentDate;
  for (let offset = 1; offset <= 366 * 50; offset += 1) {
    candidate = addIsoDateDays(candidate, 1);
    if (input.endsOn && candidate > input.endsOn) return null;
    if (matches(candidate, input.anchorDate, input.definition))
      return candidate;
  }
  return null;
}
