import {
  addDays,
  localIsoDate,
  monthGridStart,
  occursOnDate,
} from '../../lib/calendarDate.js';
import type { CalendarFeedItem } from '../../types/calendar.types.js';
import { CalendarEventItem } from './CalendarEventItem.js';

const weekdays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

export function MonthCalendar({
  date,
  selectedDate,
  items,
  onSelectDate,
  showTravelBlocks = false,
  selectionMode = false,
  selectedIds,
  onSelectEvent,
}: {
  date: Date;
  selectedDate: Date;
  items: CalendarFeedItem[];
  onSelectDate: (date: Date) => void;
  showTravelBlocks?: boolean | undefined;
  selectionMode?: boolean | undefined;
  selectedIds?: ReadonlySet<string> | undefined;
  onSelectEvent?: ((eventId: string) => void) | undefined;
}) {
  const start = monthGridStart(date);
  const days = Array.from({ length: 42 }, (_, index) => addDays(start, index));
  const todayKey = localIsoDate(new Date());
  const selectedKey = localIsoDate(selectedDate);
  return (
    <section
      aria-label="Měsíční kalendář"
      className="overflow-hidden rounded-lg border border-border bg-surface-raised"
    >
      <div className="grid grid-cols-7 border-b border-border bg-surface-subtle text-center text-caption font-semibold text-text-muted">
        {weekdays.map((weekday) => (
          <div className="py-2" key={weekday}>
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = localIsoDate(day);
          const allVisible = items.filter((item) => occursOnDate(item, day));
          const visible = showTravelBlocks
            ? allVisible
            : allVisible.filter(
                ({ sourceType }) => sourceType !== 'TRAVEL_BLOCK',
              );
          return (
            <div
              key={key}
              className={`min-h-24 border-b border-r border-border p-1 last:border-r-0 sm:min-h-32 sm:p-2 ${day.getMonth() === date.getMonth() ? 'bg-surface-raised' : 'bg-surface-subtle text-text-muted'} ${key === selectedKey ? 'ring-2 ring-inset ring-focus' : ''}`}
            >
              <button
                type="button"
                aria-label={day.toLocaleDateString('cs-CZ', {
                  dateStyle: 'full',
                })}
                aria-current={key === todayKey ? 'date' : undefined}
                onClick={() => onSelectDate(day)}
                className={`grid size-8 place-items-center rounded-full text-body-sm focus-visible:outline-2 focus-visible:outline-focus ${key === todayKey ? 'bg-primary text-primary-foreground' : 'hover:bg-surface-hover'}`}
              >
                {day.getDate()}
              </button>
              <div className="mt-1 hidden gap-1 sm:grid">
                {visible.slice(0, 3).map((item) => {
                  const travel = items.find(
                    (candidate) =>
                      candidate.sourceType === 'TRAVEL_BLOCK' &&
                      candidate.eventId === item.id &&
                      occursOnDate(candidate, day),
                  );
                  const travelMinutes =
                    travel?.sourceType === 'TRAVEL_BLOCK'
                      ? Math.ceil(travel.durationSeconds / 60)
                      : 0;
                  return (
                    <div
                      key={`${item.sourceType}-${item.id}`}
                      className="grid gap-0.5"
                    >
                      <CalendarEventItem
                        item={item}
                        compact
                        selectionMode={selectionMode}
                        selected={
                          item.sourceType === 'CALENDAR_EVENT' &&
                          Boolean(selectedIds?.has(item.id))
                        }
                        onSelect={onSelectEvent}
                      />
                      {!showTravelBlocks && travelMinutes > 0 ? (
                        <span className="truncate px-1 text-caption text-text-muted">
                          🚗 cesta přibližně {String(travelMinutes)} min
                        </span>
                      ) : null}
                    </div>
                  );
                })}
                {visible.length > 3 ? (
                  <p className="px-1 text-caption text-text-muted">
                    + {visible.length - 3} další
                  </p>
                ) : null}
              </div>
              {visible.length ? (
                <span
                  className="mx-auto mt-1 block size-1.5 rounded-full bg-primary sm:hidden"
                  aria-label={`${String(visible.length)} událostí`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
