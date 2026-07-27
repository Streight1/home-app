import { occursOnDate } from '../../lib/calendarDate.js';
import type { CalendarFeedItem } from '../../types/calendar.types.js';
import { CalendarEventItem } from '../calendar/CalendarEventItem.js';

export function AllDaySection({
  days,
  items,
  selectionMode = false,
  selectedIds,
  onSelectEvent,
}: {
  days: Date[];
  items: CalendarFeedItem[];
  selectionMode?: boolean | undefined;
  selectedIds?: ReadonlySet<string> | undefined;
  onSelectEvent?: ((eventId: string) => void) | undefined;
}) {
  return (
    <div
      className="grid border-b border-border bg-surface-raised"
      style={{
        gridTemplateColumns: `4rem repeat(${String(days.length)}, minmax(11rem, 1fr))`,
      }}
    >
      <span className="sticky left-0 z-30 border-r border-border bg-surface-raised p-2 text-caption text-text-muted">
        Celý den
      </span>
      {days.map((day) => {
        const visible = items.filter(
          (item) =>
            'isAllDay' in item && item.isAllDay && occursOnDate(item, day),
        );
        return (
          <div
            key={day.toISOString()}
            className="grid min-h-11 gap-1 border-r border-border p-1"
          >
            {visible.map((item) => (
              <CalendarEventItem
                key={`${item.sourceType}-${item.id}`}
                item={item}
                compact
                selectionMode={selectionMode}
                selected={
                  item.sourceType === 'CALENDAR_EVENT' &&
                  Boolean(selectedIds?.has(item.id))
                }
                onSelect={onSelectEvent}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
