import type { CalendarFeedItem } from '../../types/calendar.types.js';

export interface EventVisualSegment {
  key: string;
  item: CalendarFeedItem;
  startAt: Date;
  endAt: Date;
  startMinute: number;
  endMinute: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export interface PositionedEventSegment extends EventVisualSegment {
  columnIndex: number;
  columnCount: number;
  leftPercentage: number;
  widthPercentage: number;
}
