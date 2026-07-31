import { formatDateOnly, parseDateOnly } from './date-only.js';

export interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function utcTimestamp(parts: ZonedDateParts): number {
  const value = new Date(0);
  value.setUTCHours(parts.hour, parts.minute, parts.second, 0);
  value.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  return value.getTime();
}

function formatter(timezone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timezone);
  if (cached) return cached;
  const value = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  formatterCache.set(timezone, value);
  return value;
}

export function isValidTimezone(timezone: string): boolean {
  try {
    formatter(timezone).format(new Date(0));
    return true;
  } catch {
    formatterCache.delete(timezone);
    return false;
  }
}

export function getZonedParts(date: Date, timezone: string): ZonedDateParts {
  const values = Object.fromEntries(
    formatter(timezone)
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year ?? 1970,
    month: values.month ?? 1,
    day: values.day ?? 1,
    hour: values.hour ?? 0,
    minute: values.minute ?? 0,
    second: values.second ?? 0,
  };
}

export function zonedPartsToInstant(
  parts: ZonedDateParts,
  timezone: string,
): Date {
  const desired = utcTimestamp(parts);
  let guess = desired;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = getZonedParts(new Date(guess), timezone);
    const observedUtc = utcTimestamp(observed);
    const adjustment = desired - observedUtc;
    if (adjustment === 0) break;
    guess += adjustment;
  }
  return new Date(guess);
}

export function shiftLocalDays(
  parts: ZonedDateParts,
  days: number,
): ZonedDateParts {
  const shifted = new Date(utcTimestamp({ ...parts, day: parts.day + days }));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

export function isoWeekday(parts: ZonedDateParts): number {
  const day = new Date(utcTimestamp(parts)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(
    utcTimestamp({
      year,
      month: month + 1,
      day: 0,
      hour: 0,
      minute: 0,
      second: 0,
    }),
  ).getUTCDate();
}

export function zonedDayBounds(
  date: Date,
  timezone: string,
): { start: Date; end: Date } {
  const current = getZonedParts(date, timezone);
  const start = zonedPartsToInstant(
    { ...current, hour: 0, minute: 0, second: 0 },
    timezone,
  );
  const tomorrow = shiftLocalDays(
    { ...current, hour: 0, minute: 0, second: 0 },
    1,
  );
  return {
    start,
    end: new Date(zonedPartsToInstant(tomorrow, timezone).getTime() - 1),
  };
}

export function addIsoDateDays(value: string, days: number): string {
  const parts = parseDateOnly(value);
  const shifted = new Date(0);
  shifted.setUTCHours(0, 0, 0, 0);
  shifted.setUTCFullYear(parts.year, parts.month - 1, parts.day + days);
  return formatDateOnly({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  });
}

export function localDateTimeCandidates(
  date: string,
  time: string,
  timezone: string,
): Date[] {
  const clock = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!clock || !isValidTimezone(timezone)) return [];
  let dateParts: ReturnType<typeof parseDateOnly>;
  try {
    dateParts = parseDateOnly(date);
  } catch {
    return [];
  }
  const parts = {
    ...dateParts,
    hour: Number(clock[1]),
    minute: Number(clock[2]),
    second: 0,
  };
  const naive = utcTimestamp(parts);
  const candidates: Date[] = [];
  for (let delta = -14 * 60; delta <= 14 * 60; delta += 15) {
    const candidate = new Date(naive + delta * 60_000);
    const observed = getZonedParts(candidate, timezone);
    if (
      observed.year === parts.year &&
      observed.month === parts.month &&
      observed.day === parts.day &&
      observed.hour === parts.hour &&
      observed.minute === parts.minute
    )
      candidates.push(candidate);
  }
  return candidates.sort((left, right) => left.getTime() - right.getTime());
}
