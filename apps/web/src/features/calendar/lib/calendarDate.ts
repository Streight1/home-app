import type { CalendarFeedItem } from '../types/calendar.types.js';

export function localIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}
export function fromIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
export function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}
export function monthGridStart(date: Date): Date {
  return startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
}
export function feedRange(
  date: Date,
  mode: 'month' | 'week' | 'day' | 'agenda',
) {
  if (mode === 'month' || mode === 'agenda') {
    const start = monthGridStart(date);
    return { from: start.toISOString(), to: addDays(start, 42).toISOString() };
  }
  if (mode === 'week') {
    const start = startOfWeek(date);
    return { from: start.toISOString(), to: addDays(start, 7).toISOString() };
  }
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return { from: start.toISOString(), to: addDays(start, 1).toISOString() };
}
export function occursOnDate(item: CalendarFeedItem, date: Date): boolean {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = addDays(start, 1);
  const itemEnd = item.end
    ? new Date(item.end)
    : new Date(new Date(item.start).getTime() + 1);
  return new Date(item.start) < end && itemEnd > start;
}
export function shiftPeriod(
  date: Date,
  mode: 'month' | 'week' | 'day' | 'agenda',
  direction: number,
) {
  const result = new Date(date);
  if (mode === 'month' || mode === 'agenda')
    result.setMonth(result.getMonth() + direction);
  else result.setDate(result.getDate() + direction * (mode === 'week' ? 7 : 1));
  return result;
}
export function calendarPeriodLabel(
  date: Date,
  mode: 'month' | 'week' | 'day' | 'agenda',
) {
  if (mode === 'month' || mode === 'agenda')
    return new Intl.DateTimeFormat('cs-CZ', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  if (mode === 'week') {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    return `${start.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return date.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatCalendarInterval({
  startsAt,
  endsAt,
  timezone,
  isAllDay,
}: {
  startsAt: string;
  endsAt: string;
  timezone: string;
  isAllDay: boolean;
}): string {
  const formatter = new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    ...(isAllDay ? {} : { hour: '2-digit', minute: '2-digit' }),
    timeZone: timezone,
  });
  return `${formatter.format(new Date(startsAt))} – ${formatter.format(new Date(endsAt))}`;
}
