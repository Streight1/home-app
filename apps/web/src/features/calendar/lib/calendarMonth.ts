export interface CalendarMonthCell {
  isoDate: string;
  day: number;
  inMonth: boolean;
}

const pad = (value: number) => String(value).padStart(2, '0');

export function parseCalendarMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  const year = Number(match?.[1]);
  const month = Number(match?.[2]);
  if (!match || month < 1 || month > 12) return null;
  return { year, month };
}

export function calendarMonthValue(date: Date) {
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}`;
}

export function shiftCalendarMonth(value: string, delta: number) {
  const parsed = parseCalendarMonth(value);
  if (!parsed) return calendarMonthValue(new Date());
  return calendarMonthValue(new Date(parsed.year, parsed.month - 1 + delta, 1));
}

export function formatCalendarMonth(value: string) {
  const parsed = parseCalendarMonth(value);
  if (!parsed) return 'Neplatný měsíc';
  const label = new Intl.DateTimeFormat('cs-CZ', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(parsed.year, parsed.month - 1, 1));
  return label.charAt(0).toLocaleUpperCase('cs-CZ') + label.slice(1);
}

export function getCalendarMonthCells(value: string): CalendarMonthCell[] {
  const parsed = parseCalendarMonth(value);
  if (!parsed) return [];
  const first = new Date(parsed.year, parsed.month - 1, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(parsed.year, parsed.month - 1, 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + index,
    );
    return {
      isoDate: `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      day: date.getDate(),
      inMonth:
        date.getFullYear() === parsed.year &&
        date.getMonth() === parsed.month - 1,
    };
  });
}

export function selectedDaysLabel(count: number) {
  const remainder100 = count % 100;
  const remainder10 = count % 10;
  const noun =
    count === 1
      ? 'den'
      : remainder100 >= 12 && remainder100 <= 14
        ? 'dní'
        : remainder10 >= 2 && remainder10 <= 4
          ? 'dny'
          : 'dní';
  return `${String(count)} ${noun}`;
}
