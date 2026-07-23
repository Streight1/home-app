import type { CalendarFeedItem } from '../types/calendar.types.js';

const time = new Intl.DateTimeFormat('cs-CZ', {
  hour: '2-digit',
  minute: '2-digit',
});

export function calendarEventAccessibleName(item: CalendarFeedItem): string {
  if (item.sourceType === 'TRAVEL_BLOCK') return 'Cesta k události';
  const people =
    item.sourceType === 'CALENDAR_EVENT'
      ? item.participants
          .map((person) => person.displayName)
          .filter((name): name is string => Boolean(name))
          .join(' a ')
      : '';
  const start = new Date(item.start);
  const end = item.end ? new Date(item.end) : null;
  const interval = item.isAllDay
    ? 'celý den'
    : `od ${time.format(start)}${end ? ` do ${time.format(end)}` : ''}`;
  return [item.title, people, interval].filter(Boolean).join(', ');
}
