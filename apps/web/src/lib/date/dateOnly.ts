export interface DateOnlyParts {
  year: number;
  month: number;
  day: number;
}

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const daysInMonth = (year: number, month: number) => {
  if (month !== 2) return DAYS_PER_MONTH[month - 1] ?? 0;
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return isLeapYear ? 29 : 28;
};

const assertDateOnlyParts = ({ year, month, day }: DateOnlyParts) => {
  if (
    !Number.isInteger(year) ||
    year < 1 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    throw new Error('INVALID_DATE_ONLY');
  }
};

export function parseDateOnly(value: string): DateOnlyParts {
  if (!DATE_ONLY_PATTERN.test(value)) throw new Error('INVALID_DATE_ONLY');
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

/** Serializes the calendar fields of a local Date; it never reads UTC fields. */
export function formatLocalDateOnly(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new Error('INVALID_DATE_ONLY');
  return formatDateOnly({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

/** Creates an explicit local-calendar Date without parsing an ISO string as UTC. */
export function localDateFromParts(parts: DateOnlyParts): Date {
  assertDateOnlyParts(parts);
  const result = new Date(0);
  result.setHours(0, 0, 0, 0);
  result.setFullYear(parts.year, parts.month - 1, parts.day);
  return result;
}

export function dateOnlyToLocalDate(value: string): Date {
  return localDateFromParts(parseDateOnly(value));
}

export function currentLocalDateOnly(now = new Date()): string {
  return formatLocalDateOnly(now);
}

export function addLocalDays(date: Date, amount: number): Date {
  if (Number.isNaN(date.getTime()) || !Number.isInteger(amount))
    throw new Error('INVALID_DATE_ONLY');
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function addDateOnlyDays(value: string, amount: number): string {
  const result = dateOnlyToLocalDate(value);
  result.setHours(12, 0, 0, 0);
  return formatLocalDateOnly(addLocalDays(result, amount));
}

export function startOfLocalDay(date: Date): Date {
  if (Number.isNaN(date.getTime())) throw new Error('INVALID_DATE_ONLY');
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function startOfLocalMonth(date: Date): Date {
  const result = startOfLocalDay(date);
  result.setDate(1);
  return result;
}

export function startOfLocalWeek(date: Date): Date {
  const result = startOfLocalDay(date);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
