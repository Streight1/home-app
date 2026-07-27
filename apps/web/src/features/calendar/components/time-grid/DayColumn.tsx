import type { CalendarFeedItem } from '../../types/calendar.types.js';
import { HOUR_HEIGHT_PX, MINUTES_PER_DAY } from './time-grid.constants.js';
import { CalendarEventBlock } from './CalendarEventBlock.js';
import { CurrentTimeIndicator } from './CurrentTimeIndicator.js';
import { TimeGridLines } from './TimeGridLines.js';
import {
  getEventVisualSegments,
  layoutOverlappingEvents,
} from './time-grid.layout.js';

export function DayColumn({
  day,
  items,
  selectionMode = false,
  selectedIds,
  onSelectEvent,
}: {
  day: Date;
  items: CalendarFeedItem[];
  selectionMode?: boolean | undefined;
  selectedIds?: ReadonlySet<string> | undefined;
  onSelectEvent?: ((eventId: string) => void) | undefined;
}) {
  const segments = layoutOverlappingEvents(
    items.flatMap((item) => getEventVisualSegments(item, day)),
  );
  return (
    <div
      role="group"
      className="relative border-r border-border bg-surface"
      style={{ height: MINUTES_PER_DAY * (HOUR_HEIGHT_PX / 60) }}
      aria-label={day.toLocaleDateString('cs-CZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })}
    >
      <TimeGridLines />
      {segments.map((segment) => (
        <CalendarEventBlock
          key={segment.key}
          segment={segment}
          selectionMode={selectionMode}
          selected={
            segment.item.sourceType === 'CALENDAR_EVENT' &&
            Boolean(selectedIds?.has(segment.item.id))
          }
          onSelect={onSelectEvent}
        />
      ))}
      <CurrentTimeIndicator day={day} />
    </div>
  );
}
