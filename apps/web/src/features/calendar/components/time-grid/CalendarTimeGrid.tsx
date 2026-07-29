import { useEffect, useMemo, useRef } from 'react';
import { addDays, startOfWeek } from '../../lib/calendarDate.js';
import type { CalendarFeedItem } from '../../types/calendar.types.js';
import { AllDaySection } from './AllDaySection.js';
import { DayColumn } from './DayColumn.js';
import { HOUR_HEIGHT_PX } from './time-grid.constants.js';
import { TimeGutter } from './TimeGutter.js';

function isToday(day: Date): boolean {
  return day.toDateString() === new Date().toDateString();
}

function initialScrollHour(days: Date[], items: CalendarFeedItem[]): number {
  if (days.some(isToday)) return Math.max(0, new Date().getHours() - 2);
  const starts = items
    .filter((item) => !('isAllDay' in item && item.isAllDay))
    .map((item) => new Date(item.start).getHours());
  return Math.max(0, (starts.length ? Math.min(...starts) : 7) - 1);
}

export function CalendarTimeGrid({
  date,
  items,
  mode,
  onSelectDate,
  selectionMode = false,
  selectedIds,
  onSelectEvent,
  onCreateAt,
}: {
  date: Date;
  items: CalendarFeedItem[];
  mode: 'day' | 'week';
  onSelectDate?: ((date: Date) => void) | undefined;
  selectionMode?: boolean | undefined;
  selectedIds?: ReadonlySet<string> | undefined;
  onSelectEvent?: ((eventId: string) => void) | undefined;
  onCreateAt?: ((date: Date, startTime: string) => void) | undefined;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const days = useMemo(() => {
    const first = mode === 'week' ? startOfWeek(date) : date;
    return Array.from({ length: mode === 'week' ? 7 : 1 }, (_, index) =>
      addDays(first, index),
    );
  }, [date, mode]);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    element.scrollTop = initialScrollHour(days, items) * HOUR_HEIGHT_PX;
  }, [days, items]);
  const columns = `4rem repeat(${String(days.length)}, minmax(11rem, 1fr))`;
  return (
    <section
      aria-label={mode === 'week' ? 'Týdenní časová osa' : 'Denní časová osa'}
      className="overflow-hidden rounded-lg border border-border bg-surface-raised"
    >
      <div
        ref={viewport}
        className="max-h-[70vh] overflow-auto overscroll-contain"
      >
        <div className={mode === 'week' ? 'min-w-[86rem]' : 'min-w-[16rem]'}>
          <div
            className="sticky top-0 z-40 grid border-b border-border bg-surface-raised shadow-sm"
            style={{ gridTemplateColumns: columns }}
          >
            <span className="sticky left-0 z-50 border-r border-border bg-surface-raised" />
            {days.map((day) => (
              <button
                key={day.toISOString()}
                type="button"
                className={`min-h-14 border-r border-border px-2 py-2 text-left focus-visible:outline-2 focus-visible:outline-focus ${isToday(day) ? 'bg-selected-surface text-primary-emphasis' : 'hover:bg-surface-hover'}`}
                onClick={() => onSelectDate?.(day)}
              >
                <span className="block text-caption uppercase text-text-muted">
                  {day.toLocaleDateString('cs-CZ', { weekday: 'short' })}
                </span>
                <span className="font-semibold">
                  {day.toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'numeric',
                  })}
                </span>
              </button>
            ))}
          </div>
          <AllDaySection
            days={days}
            items={items}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelectEvent={onSelectEvent}
          />
          <div className="grid" style={{ gridTemplateColumns: columns }}>
            <TimeGutter />
            {days.map((day) => (
              <DayColumn
                key={day.toISOString()}
                day={day}
                items={items}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onSelectEvent={onSelectEvent}
                onCreateAt={onCreateAt}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="sr-only">
        Události lze také procházet v seznamovém zobrazení kalendáře.
      </p>
    </section>
  );
}
