import { Bike, CarFront, Footprints } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Avatar } from '../../../../components/ui/Avatar/Avatar.js';
import type { TravelCalendarItem } from '../../types/calendar.types.js';

export function CalendarTravelBlock({
  item,
  compact = false,
}: {
  item: TravelCalendarItem;
  compact?: boolean;
}) {
  const workspace = useWorkspaceNavigation();
  const Icon = item.routeMode.startsWith('CAR')
    ? CarFront
    : item.routeMode.startsWith('FOOT')
      ? Footprints
      : Bike;
  const departure = new Date(item.start).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const arrival = new Date(item.end).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const durationMinutes = Math.ceil(item.durationSeconds / 60);
  return (
    <article
      data-calendar-travel-surface
      data-departure-at={item.start}
      data-arrival-at={item.end}
      data-buffer-minutes={item.bufferMinutes}
      className="h-full w-full min-w-0 overflow-hidden rounded-sm border border-dashed border-info bg-info-soft/70"
    >
      <button
        type="button"
        onClick={() => workspace.navigate(item.navigationTarget)}
        aria-label={`${item.title}, přibližně ${String(durationMinutes)} minut${item.traveler?.displayName ? `, ${item.traveler.displayName}` : ''}`}
        className="flex h-full min-h-11 w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-focus"
      >
        <Icon className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-sm font-semibold">
            {item.title} · přibližně {durationMinutes} min
          </span>
          {!compact ? (
            <span className="block text-caption text-text-muted">
              Odjezd {departure} · příjezd {arrival}
              {item.bufferMinutes > 0
                ? ` · rezerva ${String(item.bufferMinutes)} min`
                : ''}
            </span>
          ) : null}
          {item.hasConflict ? (
            <span className="block text-caption font-medium text-danger">
              Chybí přibližně {Math.ceil(item.missingSeconds / 60)} min.
            </span>
          ) : null}
        </span>
        {item.traveler ? (
          <Avatar
            imageUrl={item.traveler.avatarUrl}
            name={item.traveler.displayName ?? 'Člen domácnosti'}
            size="sm"
          />
        ) : null}
      </button>
    </article>
  );
}
