import { Check, CheckSquare2, Clock3, ListTodo, MoonStar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCompleteTask } from '../../../tasks/tasks.public.js';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Avatar } from '../../../../components/ui/Avatar/Avatar.js';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import type { CalendarFeedItem } from '../../types/calendar.types.js';
import { CalendarTravelBlock } from '../travel/CalendarTravelBlock.js';
import { calendarEventAccessibleName } from '../../lib/calendarEventAccessibleName.js';
import { calendarVisualClasses } from './calendarVisualClasses.js';

export function CalendarEventItem({
  item,
  compact = false,
  selectionMode = false,
  selected = false,
  onSelect,
}: {
  item: CalendarFeedItem;
  compact?: boolean | undefined;
  selectionMode?: boolean | undefined;
  selected?: boolean | undefined;
  onSelect?: ((eventId: string) => void) | undefined;
}) {
  const workspace = useWorkspaceNavigation();
  const queryClient = useQueryClient();
  const complete = useCompleteTask();
  if (item.sourceType === 'TRAVEL_BLOCK')
    return <CalendarTravelBlock item={item} compact={compact} />;
  const start = new Date(item.start);
  const end = item.end ? new Date(item.end) : null;
  const nextDay = Boolean(end && start.toDateString() !== end.toDateString());
  const visual =
    item.sourceType === 'CALENDAR_EVENT'
      ? (item.visual ?? {
          colorToken: item.colorToken,
          isShared: item.participants.length > 1,
          kind:
            item.eventType === 'WORK_SHIFT'
              ? ('WORK_SHIFT' as const)
              : ('EVENT' as const),
        })
      : {
          colorToken: 'neutral' as const,
          kind: 'TASK' as const,
        };
  const participants =
    item.sourceType === 'CALENDAR_EVENT' ? item.participants : [];
  const activate = () => {
    if (selectionMode && item.sourceType === 'CALENDAR_EVENT')
      onSelect?.(item.id);
    else workspace.navigate(item.navigationTarget);
  };
  return (
    <article
      data-calendar-event-surface=""
      data-selected={selected ? 'true' : undefined}
      className={`flex min-w-0 gap-2 overflow-hidden rounded-md border border-l-4 shadow-sm transition-colors ${calendarVisualClasses[visual.colorToken]} ${compact ? 'h-full w-full items-start' : 'items-center px-2 py-2'} ${item.sourceType === 'CALENDAR_EVENT' && item.taskLink?.status === 'COMPLETED' ? 'opacity-70' : ''}`}
    >
      <button
        type="button"
        aria-label={`${selectionMode ? (selected ? 'Zrušit výběr' : 'Vybrat') : 'Otevřít'}: ${calendarEventAccessibleName(item)}`}
        aria-pressed={selectionMode ? selected : undefined}
        onClick={activate}
        className={`${compact ? 'flex h-full flex-col items-stretch justify-start px-2 py-2' : ''} min-h-11 min-w-0 flex-1 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
      >
        <span className="flex items-center gap-1.5 text-body-sm font-semibold text-current">
          {selectionMode && item.sourceType === 'CALENDAR_EVENT' ? (
            <CheckSquare2 className="size-4 shrink-0" aria-hidden="true" />
          ) : visual.kind === 'TASK' ? (
            <ListTodo className="size-4 shrink-0" aria-hidden="true" />
          ) : visual.kind === 'WORK_SHIFT' && nextDay ? (
            <MoonStar className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Clock3 className="size-4 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">{item.title}</span>
        </span>
        {!compact ? (
          <span className="mt-1 block text-caption opacity-80">
            {item.isAllDay
              ? 'Celý den'
              : start.toLocaleTimeString('cs-CZ', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
            {end && !item.isAllDay
              ? `–${end.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}${nextDay ? ' (+1 den)' : ''}`
              : ''}
          </span>
        ) : null}
      </button>
      {participants.slice(0, 2).map((person) => (
        <span key={person.id} className={compact ? 'pt-2' : undefined}>
          <Avatar
            imageUrl={person.avatarUrl}
            name={person.displayName ?? 'Člen'}
            size="sm"
          />
        </span>
      ))}
      {!selectionMode && item.sourceType === 'TASK' && item.canComplete ? (
        <IconButton
          aria-label={`Označit úkol „${item.title}“ jako splněný`}
          variant="ghost"
          disabled={complete.isPending}
          onClick={() =>
            complete.mutate(
              { taskId: item.id },
              {
                onSuccess: () =>
                  void queryClient.invalidateQueries({
                    queryKey: ['calendar'],
                  }),
              },
            )
          }
        >
          <Check className="size-4" aria-hidden="true" />
        </IconButton>
      ) : null}
      {!selectionMode &&
      item.sourceType === 'CALENDAR_EVENT' &&
      item.taskLink?.canComplete ? (
        <IconButton
          aria-label={`Označit úkol „${item.title}“ jako splněný`}
          variant="ghost"
          disabled={complete.isPending}
          onClick={() =>
            complete.mutate(
              { taskId: item.taskLink?.taskId ?? '' },
              {
                onSuccess: () =>
                  void queryClient.invalidateQueries({
                    queryKey: ['calendar'],
                  }),
              },
            )
          }
        >
          <Check className="size-4" aria-hidden="true" />
        </IconButton>
      ) : null}
    </article>
  );
}
