import type { CalendarFeedItem } from '../../types/calendar.types.js';
import {
  DEFAULT_TIMED_ITEM_MINUTES,
  MIN_EVENT_HEIGHT_PX,
  MINUTE_HEIGHT_PX,
  MINUTES_PER_DAY,
} from './time-grid.constants.js';
import type {
  EventVisualSegment,
  PositionedEventSegment,
} from './time-grid.types.js';

function dayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getMinutesSinceStartOfDay(value: Date, day: Date): number {
  return (value.getTime() - dayStart(day).getTime()) / 60_000;
}

function itemEnd(item: CalendarFeedItem): Date {
  return item.end
    ? new Date(item.end)
    : new Date(
        new Date(item.start).getTime() + DEFAULT_TIMED_ITEM_MINUTES * 60_000,
      );
}

export function getEventVisualSegments(
  item: CalendarFeedItem,
  day: Date,
): EventVisualSegment[] {
  if ('isAllDay' in item && item.isAllDay) return [];
  const start = new Date(item.start);
  const end = itemEnd(item);
  const startOfDay = dayStart(day);
  const endOfDay = new Date(startOfDay.getTime() + MINUTES_PER_DAY * 60_000);
  if (start >= endOfDay || end <= startOfDay) return [];
  const segmentStart = start < startOfDay ? startOfDay : start;
  const segmentEnd = end > endOfDay ? endOfDay : end;
  return [
    {
      key: `${item.sourceType}-${item.id}-${startOfDay.toISOString()}`,
      item,
      startAt: segmentStart,
      endAt: segmentEnd,
      startMinute: Math.max(0, getMinutesSinceStartOfDay(segmentStart, day)),
      endMinute: Math.min(
        MINUTES_PER_DAY,
        getMinutesSinceStartOfDay(segmentEnd, day),
      ),
      continuesBefore: start < startOfDay,
      continuesAfter: end > endOfDay,
    },
  ];
}

export const getSegmentTopPx = (startMinute: number): number =>
  startMinute * MINUTE_HEIGHT_PX;

export const getEventDurationMinutes = (
  startMinute: number,
  endMinute: number,
): number => Math.max(0, endMinute - startMinute);

export const getSegmentHeightPx = (
  startMinute: number,
  endMinute: number,
): number =>
  Math.max(
    MIN_EVENT_HEIGHT_PX,
    getEventDurationMinutes(startMinute, endMinute) * MINUTE_HEIGHT_PX,
  );

class MinHeap<T> {
  private readonly values: T[] = [];
  public constructor(private readonly compare: (left: T, right: T) => number) {}
  public get size() {
    return this.values.length;
  }
  public peek() {
    return this.values[0];
  }
  public push(value: T) {
    this.values.push(value);
    for (let index = this.values.length - 1; index > 0; ) {
      const parent = Math.floor((index - 1) / 2);
      const parentValue = this.values[parent];
      if (parentValue === undefined || this.compare(parentValue, value) <= 0)
        break;
      this.values[index] = parentValue;
      this.values[parent] = value;
      index = parent;
    }
  }
  public pop(): T | undefined {
    const first = this.values[0];
    const last = this.values.pop();
    if (this.values.length && last !== undefined) {
      this.values[0] = last;
      for (let index = 0; ; ) {
        const left = index * 2 + 1;
        const right = left + 1;
        let smallest = index;
        if (
          this.values[left] !== undefined &&
          this.compare(this.values[left] as T, this.values[smallest] as T) < 0
        )
          smallest = left;
        if (
          this.values[right] !== undefined &&
          this.compare(this.values[right] as T, this.values[smallest] as T) < 0
        )
          smallest = right;
        if (smallest === index) break;
        [this.values[index], this.values[smallest]] = [
          this.values[smallest] as T,
          this.values[index] as T,
        ];
        index = smallest;
      }
    }
    return first;
  }
}

function layoutGroup(group: EventVisualSegment[]): PositionedEventSegment[] {
  const active = new MinHeap<{ end: number; column: number }>(
    (left, right) => left.end - right.end || left.column - right.column,
  );
  const free = new MinHeap<number>((left, right) => left - right);
  let nextColumn = 0;
  const assigned = group.map((segment) => {
    while (active.peek() && (active.peek()?.end ?? 0) <= segment.startMinute) {
      const released = active.pop();
      if (released) free.push(released.column);
    }
    const column = free.size > 0 ? (free.pop() ?? nextColumn) : nextColumn++;
    active.push({ end: segment.endMinute, column });
    return { segment, column };
  });
  const columnCount = Math.max(1, nextColumn);
  return assigned.map(({ segment, column }) => ({
    ...segment,
    columnIndex: column,
    columnCount,
    leftPercentage: (column / columnCount) * 100,
    widthPercentage: 100 / columnCount,
  }));
}

export function layoutOverlappingEvents(
  segments: EventVisualSegment[],
): PositionedEventSegment[] {
  const sorted = [...segments].sort(
    (left, right) =>
      left.startMinute - right.startMinute ||
      left.endMinute - right.endMinute ||
      left.key.localeCompare(right.key),
  );
  const groups: EventVisualSegment[][] = [];
  let current: EventVisualSegment[] = [];
  let groupEnd = -1;
  for (const segment of sorted) {
    if (current.length && segment.startMinute >= groupEnd) {
      groups.push(current);
      current = [];
      groupEnd = -1;
    }
    current.push(segment);
    groupEnd = Math.max(groupEnd, segment.endMinute);
  }
  if (current.length) groups.push(current);
  return groups.flatMap(layoutGroup);
}
