import { CalendarDays } from 'lucide-react';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { occursOnDate } from '../../lib/calendarDate.js';
import type { CalendarFeedItem } from '../../types/calendar.types.js';
import { CalendarEventItem } from './CalendarEventItem.js';

export function CalendarAgendaList({
  items,
  date,
  filterDate = true,
  selectionMode = false,
  selectedIds,
  onSelectEvent,
}: {
  items: CalendarFeedItem[];
  date: Date;
  filterDate?: boolean | undefined;
  selectionMode?: boolean | undefined;
  selectedIds?: ReadonlySet<string> | undefined;
  onSelectEvent?: ((eventId: string) => void) | undefined;
}) {
  const visible = filterDate
    ? items.filter((item) => occursOnDate(item, date))
    : items;
  if (!visible.length)
    return (
      <EmptyState
        eyebrow={<CalendarDays className="mx-auto size-6" aria-hidden="true" />}
        title="Žádné události"
        description="Pro vybrané období nejsou naplánované žádné události ani úkoly."
      />
    );
  return (
    <div className="grid gap-2">
      {visible.map((item) => (
        <CalendarEventItem
          key={`${item.sourceType}-${item.id}`}
          item={item}
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
}
