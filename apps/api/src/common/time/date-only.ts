export interface DateOnlyParts {
  year: number;
  month: number;
  day: number;
}

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function daysInDateOnlyMonth(year: number, month: number): number {
  if (month !== 2) return DAYS_PER_MONTH[month - 1] ?? 0;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return leapYear ? 29 : 28;
}

function assertDateOnlyParts({ year, month, day }: DateOnlyParts): void {
  if (
    !Number.isInteger(year) ||
    year < 1 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > daysInDateOnlyMonth(year, month)
  )
    throw new Error('INVALID_ISO_DATE');
}

export function parseDateOnly(value: string): DateOnlyParts {
  if (!DATE_ONLY_PATTERN.test(value)) throw new Error('INVALID_ISO_DATE');
  const [year, month, day] = value.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const parts = { year, month, day };
  assertDateOnlyParts(parts);
  return parts;
}

export function isDateOnly(value: string): boolean {
  try {
    parseDateOnly(value);
    return true;
  } catch {
    return false;
  }
}

export function formatDateOnly(parts: DateOnlyParts): string {
  assertDateOnlyParts(parts);
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

/**
 * Prisma represents a PostgreSQL DATE as Date at its adapter boundary. The
 * instant is an implementation detail and must never be converted to a local
 * timezone; UTC midnight keeps the date-only value stable.
 */
export function dateOnlyToDatabase(value: string): Date {
  const parts = parseDateOnly(value);
  const result = new Date(0);
  result.setUTCHours(0, 0, 0, 0);
  result.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  return result;
}

export function serializeDateOnly(value: Date): string {
  if (Number.isNaN(value.getTime())) throw new Error('INVALID_ISO_DATE');
  return formatDateOnly({
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  });
}

export function serializeNullableDateOnly(value: Date | null): string | null {
  return value === null ? null : serializeDateOnly(value);
}

export function currentDateOnlyInTimeZone(
  now = new Date(),
  timeZone = 'Europe/Prague',
): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return formatDateOnly({
    year: parts.year ?? 1970,
    month: parts.month ?? 1,
    day: parts.day ?? 1,
  });
}
