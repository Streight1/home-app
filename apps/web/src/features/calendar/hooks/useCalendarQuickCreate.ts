import { localIsoDate } from '../lib/calendarDate.js';
import { useCreateCalendarEventDialog } from './useCreateCalendarEventDialog.js';

export function useCalendarQuickCreate() {
  const open = useCreateCalendarEventDialog();
  return {
    fromToolbar: (date: Date) =>
      open({ source: 'calendar-toolbar', date: localIsoDate(date) }),
    fromMonthDay: (date: Date) =>
      open({ source: 'month-day-double-click', date: localIsoDate(date) }),
    fromTimeSlot: (date: Date, startTime: string) =>
      open({
        source: 'time-slot-double-click',
        date: localIsoDate(date),
        startTime,
      }),
  };
}
