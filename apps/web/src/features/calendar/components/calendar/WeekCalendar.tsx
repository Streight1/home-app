import type { CalendarFeedItem } from '../../types/calendar.types.js';
import { CalendarTimeGrid } from '../time-grid/CalendarTimeGrid.js';

export function WeekCalendar({
  date,
  items,
  onSelectDate,
}: {
  date: Date;
  items: CalendarFeedItem[];
  onSelectDate: (date: Date) => void;
}) {
  return (
    <CalendarTimeGrid
      date={date}
      items={items}
      mode="week"
      onSelectDate={onSelectDate}
    />
  );
}
