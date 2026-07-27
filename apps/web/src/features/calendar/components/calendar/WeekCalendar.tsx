import type { CalendarFeedItem } from '../../types/calendar.types.js';
import { CalendarTimeGrid } from '../time-grid/CalendarTimeGrid.js';

export function WeekCalendar({
  date,
  items,
  onSelectDate,
  selectionMode,
  selectedIds,
  onSelectEvent,
}: {
  date: Date;
  items: CalendarFeedItem[];
  onSelectDate: (date: Date) => void;
  selectionMode?: boolean | undefined;
  selectedIds?: ReadonlySet<string> | undefined;
  onSelectEvent?: ((eventId: string) => void) | undefined;
}) {
  return (
    <CalendarTimeGrid
      date={date}
      items={items}
      mode="week"
      onSelectDate={onSelectDate}
      selectionMode={selectionMode}
      selectedIds={selectedIds}
      onSelectEvent={onSelectEvent}
    />
  );
}
