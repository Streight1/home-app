import { describe, expect, it } from 'vitest';
import type { EventCalendarItem } from '../../types/calendar.types.js';
import {
  getEventDurationMinutes,
  getEventVisualSegments,
  getSegmentHeightPx,
  getSegmentTopPx,
  layoutOverlappingEvents,
} from './time-grid.layout.js';
import { HOUR_HEIGHT_PX } from './time-grid.constants.js';

const day = new Date(2026, 6, 20);
const event = (
  id: string,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): EventCalendarItem => ({
  sourceType: 'CALENDAR_EVENT',
  id,
  title: id,
  start: new Date(2026, 6, 20, startHour, startMinute).toISOString(),
  end: new Date(2026, 6, 20, endHour, endMinute).toISOString(),
  status: 'ACTIVE',
  eventType: 'GENERAL',
  colorToken: 'blue',
  isAllDay: false,
  participants: [],
  taskLink: null,
  navigationTarget: { area: 'calendar', screen: 'detail', eventId: id },
});

describe('calendar time-grid layout', () => {
  it('positions 08:00 at exactly eight hours', () => {
    expect(getSegmentTopPx(8 * 60)).toBe(8 * HOUR_HEIGHT_PX);
  });

  it('positions and sizes an 08:30–10:00 event', () => {
    const [segment] = getEventVisualSegments(event('a', 8, 30, 10, 0), day);
    expect(segment?.startMinute).toBe(510);
    expect(
      segment && getSegmentHeightPx(segment.startMinute, segment.endMinute),
    ).toBe(1.5 * HOUR_HEIGHT_PX);
  });

  it.each([
    ['Denní 08:00–20:00', 8, 0, 20, 0, 720, 12],
    ['Ranní 08:00–14:00', 8, 0, 14, 0, 360, 6],
    ['Odpolední 14:00–20:00', 14, 0, 20, 0, 360, 6],
  ])(
    'keeps the full geometry for %s',
    (_label, startHour, startMinute, endHour, endMinute, minutes, hours) => {
      const [segment] = getEventVisualSegments(
        event('shift', startHour, startMinute, endHour, endMinute),
        day,
      );
      expect(segment).toBeDefined();
      expect(
        segment &&
          getEventDurationMinutes(segment.startMinute, segment.endMinute),
      ).toBe(minutes);
      expect(
        segment && getSegmentHeightPx(segment.startMinute, segment.endMinute),
      ).toBe(hours * HOUR_HEIGHT_PX);
    },
  );

  it('places two overlapping events in two columns', () => {
    const segments = [
      ...getEventVisualSegments(event('a', 10, 0, 11, 30), day),
      ...getEventVisualSegments(event('b', 10, 30, 12, 0), day),
    ];
    expect(
      layoutOverlappingEvents(segments).map((item) => item.columnCount),
    ).toEqual([2, 2]);
  });

  it('places three overlapping events in three columns', () => {
    const segments = [
      ...getEventVisualSegments(event('a', 10, 0, 12, 0), day),
      ...getEventVisualSegments(event('b', 10, 15, 11, 0), day),
      ...getEventVisualSegments(event('c', 10, 30, 11, 30), day),
    ];
    expect(
      layoutOverlappingEvents(segments).map((item) => item.columnCount),
    ).toEqual([3, 3, 3]);
  });

  it('gives non-overlapping events full width', () => {
    const segments = [
      ...getEventVisualSegments(event('a', 8, 0, 9, 0), day),
      ...getEventVisualSegments(event('b', 9, 0, 10, 0), day),
    ];
    expect(
      layoutOverlappingEvents(segments).map((item) => item.widthPercentage),
    ).toEqual([100, 100]);
  });

  it('creates one visual segment per day for one night entity', () => {
    const night = event('night', 20, 0, 8, 0);
    night.end = new Date(2026, 6, 21, 8).toISOString();
    const first = getEventVisualSegments(night, day)[0];
    const second = getEventVisualSegments(night, new Date(2026, 6, 21))[0];
    expect(first?.continuesAfter).toBe(true);
    expect(second?.continuesBefore).toBe(true);
    expect(
      first && getEventDurationMinutes(first.startMinute, first.endMinute),
    ).toBe(240);
    expect(
      second && getEventDurationMinutes(second.startMinute, second.endMinute),
    ).toBe(480);
    expect(first?.item.id).toBe(second?.item.id);
  });

  it('positions a travel block from its departure time', () => {
    const travel = {
      sourceType: 'TRAVEL_BLOCK' as const,
      id: 'travel',
      eventId: 'event',
      title: 'Cesta na kontrolu',
      eventTitle: 'Kontrola',
      start: new Date(2026, 6, 20, 7, 30).toISOString(),
      end: new Date(2026, 6, 20, 8).toISOString(),
      eventStartsAt: new Date(2026, 6, 20, 8, 10).toISOString(),
      status: 'READY',
      routeMode: 'CAR_FAST',
      durationSeconds: 1800,
      distanceMeters: 10000,
      bufferMinutes: 10,
      hasConflict: false,
      missingSeconds: 0,
      traveler: null,
      navigationTarget: {
        area: 'calendar' as const,
        screen: 'detail' as const,
        eventId: 'event',
      },
    };
    expect(getEventVisualSegments(travel, day)[0]?.startMinute).toBe(450);
  });
});
