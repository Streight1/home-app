import type {
  CalendarEventDraft,
  CalendarEventDraftSource,
} from '../types/calendar.types.js';
import { fromIsoDate, localIsoDate } from './calendarDate.js';

export interface CreateCalendarEventDraftInput {
  source: CalendarEventDraftSource;
  date?: string;
  startTime?: string;
  durationMinutes?: number;
}

export type CalendarClock = () => Date;

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

function timeParts(value: string): { hours: number; minutes: number } {
  const match = TIME.exec(value);
  if (!match) return { hours: 9, minutes: 0 };
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

function nextHalfHour(now: Date): Date {
  const result = new Date(now);
  const onBoundary =
    result.getMinutes() % 30 === 0 &&
    result.getSeconds() === 0 &&
    result.getMilliseconds() === 0;
  const minutesToAdd = onBoundary ? 30 : 30 - (result.getMinutes() % 30);
  result.setSeconds(0, 0);
  result.setMinutes(result.getMinutes() + minutesToAdd);
  return result;
}

function defaultDateTime(
  input: CreateCalendarEventDraftInput,
  now: Date,
): Date {
  if (!input.date) return nextHalfHour(now);
  const date = fromIsoDate(input.date);
  const { hours, minutes } = timeParts(input.startTime ?? '09:00');
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function createCalendarEventDraft(
  input: CreateCalendarEventDraftInput,
  clock: CalendarClock = () => new Date(),
): CalendarEventDraft {
  const start = defaultDateTime(input, clock());
  const durationMinutes = Math.max(5, input.durationMinutes ?? 60);
  return {
    source: input.source,
    date: localIsoDate(start),
    startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
    durationMinutes,
    isAllDay: false,
  };
}

export function calendarEventDraftEnd(draft: CalendarEventDraft): string {
  const start = fromIsoDate(draft.date);
  const { hours, minutes } = timeParts(draft.startTime);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + draft.durationMinutes * 60_000);
  return `${localIsoDate(end)}T${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
}

export function calendarEventDraftStart(draft: CalendarEventDraft): string {
  return `${draft.date}T${draft.startTime}`;
}
