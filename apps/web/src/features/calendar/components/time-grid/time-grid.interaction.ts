import { MINUTES_PER_DAY } from './time-grid.constants.js';

export const CREATE_EVENT_SLOT_MINUTES = 30;

export function getTimeSlotMinutesFromPointer(
  clientY: number,
  columnTop: number,
  columnHeight: number,
): number {
  if (columnHeight <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, (clientY - columnTop) / columnHeight));
  const rawMinutes = ratio * MINUTES_PER_DAY;
  return Math.min(
    MINUTES_PER_DAY - CREATE_EVENT_SLOT_MINUTES,
    Math.floor(rawMinutes / CREATE_EVENT_SLOT_MINUTES) *
      CREATE_EVENT_SLOT_MINUTES,
  );
}

export function timeGridSlotLabel(minutes: number): string {
  const bounded = Math.min(
    MINUTES_PER_DAY - 1,
    Math.max(0, Math.floor(minutes)),
  );
  return `${String(Math.floor(bounded / 60)).padStart(2, '0')}:${String(
    bounded % 60,
  ).padStart(2, '0')}`;
}

export function isCalendarInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'button,a,input,select,textarea,[role="button"],[data-calendar-no-create]',
      ),
    )
  );
}
