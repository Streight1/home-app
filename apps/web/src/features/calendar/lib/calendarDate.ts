import type { CalendarFeedItem } from '../types/calendar.types.js';
import {
  addLocalDays,
  dateOnlyToLocalDate,
  formatLocalDateOnly,
  isDateOnly,
  startOfLocalDay,
  startOfLocalMonth,
  startOfLocalWeek,
} from '../../../lib/date/dateOnly.js';

export const localIsoDate = formatLocalDateOnly;
export const fromIsoDate = dateOnlyToLocalDate;
export const addDays = addLocalDays;
export const startOfWeek = startOfLocalWeek;
export function monthGridStart(date: Date): Date {
  return startOfWeek(startOfLocalMonth(date));
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
  const start = startOfLocalDay(date);
  return { from: start.toISOString(), to: addDays(start, 1).toISOString() };
}
export function occursOnDate(item: CalendarFeedItem, date: Date): boolean {
  if (
    item.sourceType === 'CALENDAR_EVENT' &&
    item.isAllDay &&
    isDateOnly(item.start) &&
    isDateOnly(item.end)
  ) {
    const dateKey = localIsoDate(date);
    return item.start <= dateKey && dateKey < item.end;
  }
  const start = startOfLocalDay(date);
  const end = addDays(start, 1);
  const itemEnd = item.end
    ? new Date(item.end)
    : new Date(new Date(item.start).getTime() + 1);
  return new Date(item.start) < end && itemEnd > start;
}

export function inclusiveAllDayEndToExclusive(value: string): string {
  return localIsoDate(addDays(fromIsoDate(value), 1));
}

export function exclusiveAllDayEndToInclusive(value: string): string {
  return localIsoDate(addDays(fromIsoDate(value), -1));
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
  allDayStartDate,
  allDayEndDateExclusive,
  timezone,
  isAllDay,
}: {
  startsAt: string | null;
  endsAt: string | null;
  allDayStartDate?: string | null | undefined;
  allDayEndDateExclusive?: string | null | undefined;
  timezone: string;
  isAllDay: boolean;
}): string {
  if (isAllDay && allDayStartDate && allDayEndDateExclusive) {
    const inclusiveEnd = exclusiveAllDayEndToInclusive(allDayEndDateExclusive);
    const formatter = new Intl.DateTimeFormat('cs-CZ', {
      dateStyle: 'long',
    });
    if (allDayStartDate === inclusiveEnd)
      return `${formatter.format(fromIsoDate(allDayStartDate))} · celý den`;
    return `${formatter.format(fromIsoDate(allDayStartDate))} – ${formatter.format(fromIsoDate(inclusiveEnd))} · celý den`;
  }
  if (!startsAt || !endsAt) return 'Čas není dostupný';
  const formatter = new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    ...(isAllDay ? {} : { hour: '2-digit', minute: '2-digit' }),
    timeZone: timezone,
  });
  return `${formatter.format(new Date(startsAt))} – ${formatter.format(new Date(endsAt))}`;
}
