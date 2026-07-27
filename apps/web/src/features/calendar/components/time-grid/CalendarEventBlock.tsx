import type { CSSProperties } from 'react';
import { CalendarEventItem } from '../calendar/CalendarEventItem.js';
import { getSegmentHeightPx, getSegmentTopPx } from './time-grid.layout.js';
import type { PositionedEventSegment } from './time-grid.types.js';

export function CalendarEventBlock({
  segment,
  selectionMode = false,
  selected = false,
  onSelect,
}: {
  segment: PositionedEventSegment;
  selectionMode?: boolean | undefined;
  selected?: boolean | undefined;
  onSelect?: ((eventId: string) => void) | undefined;
}) {
  const inset = 2;
  const style: CSSProperties = {
    top: getSegmentTopPx(segment.startMinute),
    height: getSegmentHeightPx(segment.startMinute, segment.endMinute),
    left: `calc(${String(segment.leftPercentage)}% + ${String(inset)}px)`,
    width: `calc(${String(segment.widthPercentage)}% - ${String(inset * 2)}px)`,
  };
  return (
    <div
      className="absolute z-10 overflow-hidden rounded-md shadow-sm focus-within:z-20 focus-within:outline-2 focus-within:outline-focus"
      style={style}
      data-calendar-event-positioner=""
      data-event-id={segment.item.id}
      data-continues-before={segment.continuesBefore || undefined}
      data-continues-after={segment.continuesAfter || undefined}
    >
      <CalendarEventItem
        item={segment.item}
        compact
        selectionMode={selectionMode}
        selected={selected}
        onSelect={onSelect}
      />
    </div>
  );
}
