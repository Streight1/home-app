import { useMemo, useState } from 'react';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import type { CalendarEvent } from '../../types/calendar.types.js';
import { addDays, fromIsoDate, localIsoDate } from '../../lib/calendarDate.js';

const localDateTime = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const join = (date: string, time: string) => `${date}T${time}`;
const split = (value: string) => ({
  date: value.slice(0, 10),
  time: value.slice(11, 16),
});

export function useCalendarEventSchedule(
  initial: CalendarEvent | undefined,
  initialDate: string | undefined,
) {
  const defaults = useMemo(() => {
    const baseDate =
      initial?.allDayStartDate ?? initialDate ?? localIsoDate(new Date());
    const start = initial?.startsAt
      ? localDateTime(initial.startsAt)
      : `${baseDate}T09:00`;
    const end = initial?.endsAt
      ? localDateTime(initial.endsAt)
      : localDateTime(new Date(new Date(start).getTime() + 60 * 60_000));
    const allDayStart = initial?.allDayStartDate ?? baseDate;
    const exclusive = initial?.allDayEndDateExclusive;
    return {
      start,
      end,
      allDayStart,
      allDayEnd: exclusive
        ? localIsoDate(addDays(fromIsoDate(exclusive), -1))
        : allDayStart,
    };
  }, [initial, initialDate]);
  const [isAllDay, setIsAllDay] = useState(initial?.isAllDay ?? false);
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [allDayStart, setAllDayStartState] = useState(defaults.allDayStart);
  const [allDayEnd, setAllDayEnd] = useState(defaults.allDayEnd);
  const [timedEndDirty, setTimedEndDirty] = useState(false);
  const [allDayEndDirty, setAllDayEndDirty] = useState(false);
  const [desiredArrival, setDesiredArrival] = useState(
    initial?.desiredArrivalAt ? localDateTime(initial.desiredArrivalAt) : '',
  );
  const setStartKeepingDuration = (next: string) => {
    const duration = new Date(end).getTime() - new Date(start).getTime();
    setStart(next);
    if (!timedEndDirty || new Date(end) < new Date(next))
      setEnd(
        localDateTime(
          new Date(new Date(next).getTime() + Math.max(duration, 60 * 60_000)),
        ),
      );
  };
  const setAllDayStart = (next: string) => {
    setAllDayStartState(next);
    if (!allDayEndDirty || allDayEnd < next) setAllDayEnd(next);
  };
  return {
    isAllDay,
    setIsAllDay,
    start,
    end,
    allDayStart,
    allDayEnd,
    desiredArrival,
    setDesiredArrival,
    setStart: setStartKeepingDuration,
    setEnd: (next: string) => {
      setTimedEndDirty(true);
      setEnd(next);
    },
    setAllDayStart,
    setAllDayEnd: (next: string) => {
      setAllDayEndDirty(true);
      setAllDayEnd(next < allDayStart ? allDayStart : next);
    },
    setTimedRange: (nextStart: string, nextEnd: string) => {
      setStart(nextStart);
      setEnd(nextEnd);
      setTimedEndDirty(false);
    },
  };
}

export type CalendarEventScheduleState = ReturnType<
  typeof useCalendarEventSchedule
>;

export function EventScheduleFields({
  value,
}: {
  value: CalendarEventScheduleState;
}) {
  const start = split(value.start);
  const end = split(value.end);
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-3 text-section-title font-semibold sm:col-span-2">
        Datum a čas
      </legend>
      <label className="flex min-h-11 items-center gap-3 text-body-sm font-medium sm:col-span-2">
        <input
          type="checkbox"
          checked={value.isAllDay}
          onChange={(event) => value.setIsAllDay(event.target.checked)}
          className="size-5 accent-primary"
        />
        Celý den
      </label>
      {value.isAllDay ? (
        <>
          <DatePicker
            label="Datum začátku"
            value={value.allDayStart}
            onChange={value.setAllDayStart}
          />
          <DatePicker
            label="Datum konce"
            value={value.allDayEnd}
            onChange={value.setAllDayEnd}
          />
          <p className="text-caption text-text-muted sm:col-span-2">
            Konec se zobrazuje včetně posledního dne; interně se ukládá jako
            následující den.
          </p>
        </>
      ) : (
        <>
          <DatePicker
            label="Datum začátku"
            value={start.date}
            onChange={(date) => value.setStart(join(date, start.time))}
          />
          <Input
            label="Čas začátku"
            type="time"
            required
            value={start.time}
            onChange={(event) =>
              value.setStart(join(start.date, event.target.value))
            }
          />
          <DatePicker
            label="Datum konce"
            value={end.date}
            onChange={(date) => value.setEnd(join(date, end.time))}
          />
          <Input
            label="Čas konce"
            type="time"
            required
            value={end.time}
            onChange={(event) =>
              value.setEnd(join(end.date, event.target.value))
            }
          />
        </>
      )}
    </fieldset>
  );
}
