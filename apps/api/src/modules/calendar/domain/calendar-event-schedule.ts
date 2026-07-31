import {
  localDateTimeCandidates,
  type ZonedDateParts,
  zonedPartsToInstant,
} from '../../../common/time/zoned-date.js';
import {
  dateOnlyToDatabase,
  parseDateOnly,
} from '../../../common/time/date-only.js';
import type { CalendarEventRecord } from './calendar.types.js';

export function parseCalendarDate(value: string): Date | null {
  try {
    return dateOnlyToDatabase(value);
  } catch {
    return null;
  }
}

function dateAtStartOfDay(value: string, timezone: string): Date {
  const candidate = localDateTimeCandidates(value, '00:00', timezone)[0];
  if (candidate) return candidate;
  let date: ReturnType<typeof parseDateOnly>;
  try {
    date = parseDateOnly(value);
  } catch {
    throw new Error('CALENDAR_INVALID_ALL_DAY_DATE');
  }
  const parts: ZonedDateParts = {
    ...date,
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
