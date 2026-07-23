import { Check, Clock3, ListTodo, MoonStar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCompleteTask } from '../../../tasks/tasks.public.js';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Avatar } from '../../../../components/ui/Avatar/Avatar.js';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import type { CalendarFeedItem } from '../../types/calendar.types.js';
import { CalendarTravelBlock } from '../travel/CalendarTravelBlock.js';
import { calendarEventAccessibleName } from '../../lib/calendarEventAccessibleName.js';

const accentClasses = {
  primary: 'border-l-primary',
  blue: 'border-l-info',
  cyan: 'border-l-accent-cyan',
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
  violet: 'border-l-member-violet',
  green: 'border-l-member-green',
  amber: 'border-l-member-amber',
  orange: 'border-l-member-orange',
  rose: 'border-l-member-rose',
  pink: 'border-l-member-pink',
  shared: 'border-l-primary',
  neutral: 'border-l-border-strong',
} as const;

export function CalendarEventItem({
  item,
  compact = false,
}: {
  item: CalendarFeedItem;
  compact?: boolean;
}) {
  const workspace = useWorkspaceNavigation();
  const queryClient = useQueryClient();
  const complete = useCompleteTask();
  if (item.sourceType === 'TRAVEL_BLOCK')
    return <CalendarTravelBlock item={item} compact={compact} />;
  const start = new Date(item.start);
  const end = item.end ? new Date(item.end) : null;
  const nextDay = Boolean(end && start.toDateString() !== end.toDateString());
  const open = () => workspace.navigate(item.navigationTarget);
  const color =
    item.sourceType === 'CALENDAR_EVENT' ? item.colorToken : 'primary';
  const participants =
    item.sourceType === 'CALENDAR_EVENT' ? item.participants : [];
  return (
    <article
      data-calendar-event-surface={compact ? '' : undefined}
      className={`flex min-w-0 gap-2 border-l-2 bg-surface-subtle px-2 ${compact ? 'h-full w-full items-start overflow-hidden' : 'items-center py-2'} ${accentClasses[color]} ${item.sourceType === 'CALENDAR_EVENT' && item.taskLink?.status === 'COMPLETED' ? 'opacity-70' : ''}`}
    >
      <button
        type="button"
        aria-label={calendarEventAccessibleName(item)}
        onClick={open}
        className={`${compact ? 'flex h-full flex-col items-stretch justify-start py-2' : ''} min-w-0 flex-1 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-focus`}
      >
        <span className="flex items-center gap-1.5 text-body-sm font-semibold text-text">
          {item.sourceType === 'TASK' ? (
            <ListTodo className="size-4 shrink-0" aria-hidden="true" />
          ) : item.eventType === 'WORK_SHIFT' && nextDay ? (
            <MoonStar className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <Clock3 className="size-4 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">{item.title}</span>
        </span>
        {!compact ? (
          <span className="mt-1 block text-caption text-text-muted">
            {item.isAllDay
              ? 'Celý den'
              : start.toLocaleTimeString('cs-CZ', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
            {end
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
      {!compact && participants.length ? (
        <span className="max-w-24 truncate text-caption text-text-muted">
          {participants.length > 1
            ? `${String(participants.length)} účastníci`
            : (participants[0]?.displayName ?? 'Člen')}
        </span>
      ) : null}
      {item.sourceType === 'TASK' && item.canComplete ? (
        <IconButton
          aria-label={`Označit úkol „${item.title}“ jako splněný`}
          variant="ghost"
          disabled={complete.isPending}
          onClick={() =>
            complete.mutate(
              { taskId: item.id },
              {
                onSuccess: () => {
                  void queryClient.invalidateQueries({
                    queryKey: ['calendar'],
                  });
                },
              },
            )
          }
        >
          <Check className="size-4" aria-hidden="true" />
        </IconButton>
      ) : null}
      {item.sourceType === 'CALENDAR_EVENT' && item.taskLink?.canComplete ? (
        <IconButton
          aria-label={`Označit úkol „${item.title}“ jako splněný`}
          variant="ghost"
          disabled={complete.isPending}
          onClick={() =>
            complete.mutate(
              { taskId: item.taskLink?.taskId ?? '' },
              {
                onSuccess: () => {
                  void queryClient.invalidateQueries({
                    queryKey: ['calendar'],
                  });
                },
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
