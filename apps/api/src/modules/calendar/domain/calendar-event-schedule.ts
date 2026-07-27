import {
  localDateTimeCandidates,
  type ZonedDateParts,
  zonedPartsToInstant,
} from '../../../common/time/zoned-date.js';
import type { CalendarEventRecord } from './calendar.types.js';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCalendarDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return date.toISOString().slice(0, 10) === value ? date : null;
}

function dateAtStartOfDay(value: string, timezone: string): Date {
  const candidate = localDateTimeCandidates(value, '00:00', timezone)[0];
  if (candidate) return candidate;
  const match = ISO_DATE.exec(value);
  if (!match) throw new Error('CALENDAR_INVALID_ALL_DAY_DATE');
  const parts: ZonedDateParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: 0,
    minute: 0,
    second: 0,
  };
  return zonedPartsToInstant(parts, timezone);
}

export function getCalendarEventBounds(
  event: Pick<
    CalendarEventRecord,
    | 'isAllDay'
    | 'startsAt'
    | 'endsAt'
    | 'allDayStartDate'
    | 'allDayEndDateExclusive'
    | 'timezone'
  >,
): { start: Date; end: Date } {
  if (!event.isAllDay) {
    if (!event.startsAt || !event.endsAt)
      throw new Error('CALENDAR_INVALID_TIMED_EVENT');
    return { start: event.startsAt, end: event.endsAt };
  }
  if (!event.allDayStartDate || !event.allDayEndDateExclusive)
    throw new Error('CALENDAR_INVALID_ALL_DAY_EVENT');
  return {
    start: dateAtStartOfDay(event.allDayStartDate, event.timezone),
    end: dateAtStartOfDay(event.allDayEndDateExclusive, event.timezone),
  };
}

export function getCalendarTravelTarget(
  event: Pick<
    CalendarEventRecord,
    'isAllDay' | 'startsAt' | 'desiredArrivalAt'
  >,
): Date | null {
  return event.isAllDay ? event.desiredArrivalAt : event.startsAt;
}
