import {
  ArrowLeft,
  Ban,
  CalendarClock,
  CheckCircle2,
  ListTodo,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { formatCalendarInterval } from '../lib/calendarDate.js';
import { Avatar } from '../../../components/ui/Avatar/Avatar.js';
import { Badge } from '../../../components/ui/Badge/Badge.js';
import { Button } from '../../../components/ui/Button/Button.js';
import { Card } from '../../../components/ui/Card/Card.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../components/ui/LoadingScreen/LoadingScreen.js';
import { RouteEstimateSummary } from '../../location/components/RouteEstimateSummary.js';
import { useCompleteTask } from '../../tasks/tasks.public.js';
import {
  useCalendarEvent,
  useCalendarMutations,
  useEventTravelPlans,
} from '../hooks/useCalendar.js';
import { CalendarEventDeleteDialog } from '../components/dialogs/CalendarEventDeleteDialog.js';

export function CalendarEventDetailPage({ eventId }: { eventId: string }) {
  const workspace = useWorkspaceNavigation();
  const queryClient = useQueryClient();
  const event = useCalendarEvent(eventId);
  const travelPlans = useEventTravelPlans(eventId);
  const { cancelEvent, deleteEvent } = useCalendarMutations();
  const completeTask = useCompleteTask();
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (event.isLoading) return <LoadingScreen message="Načítáme událost…" />;
  if (event.isError || !event.data)
    return (
      <InlineAlert variant="danger">Událost se nepodařilo načíst.</InlineAlert>
    );
  const item = event.data;
  return (
    <div className="grid gap-5">
      <div>
        <Button
          variant="ghost"
          onClick={() =>
            workspace.navigate({ area: 'calendar', screen: 'calendar' })
          }
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Zpět do kalendáře
        </Button>
      </div>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant={item.status === 'ACTIVE' ? 'primary' : 'warning'}>
            {item.source === 'TASK'
              ? item.taskLink?.status === 'COMPLETED'
                ? 'Dokončený úkol'
                : 'Zdroj: Úkol'
              : item.type === 'WORK_SHIFT'
                ? 'Pracovní směna'
                : 'Událost'}
          </Badge>
          <h1 className="mt-3 text-page-title font-semibold">{item.title}</h1>
        </div>
        {item.permissions.canEdit || item.taskLink ? (
          <div className="flex flex-wrap gap-2">
            {item.taskLink ? (
              <Button
                variant="secondary"
                onClick={() =>
                  workspace.navigate({
                    area: 'tasks',
                    screen: 'detail',
                    taskId: item.taskLink?.taskId ?? '',
                  })
                }
              >
                <ListTodo className="size-4" aria-hidden="true" />
                Otevřít úkol
              </Button>
            ) : null}
            {item.taskLink && item.permissions.canCompleteTask ? (
              <Button
                variant="primary"
                loading={completeTask.isPending}
                onClick={() =>
                  completeTask.mutate(
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
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Označit úkol jako splněný
              </Button>
            ) : null}
            {item.permissions.canEdit ? (
              <Button
                onClick={() =>
                  workspace.openOverlay({ kind: 'calendar-edit', eventId })
                }
              >
                <Pencil className="size-4" aria-hidden="true" />
                Upravit
              </Button>
            ) : null}
            {item.status === 'ACTIVE' && item.permissions.canCancel ? (
              <Button
                loading={cancelEvent.isPending}
                onClick={() => cancelEvent.mutate(eventId)}
              >
                <Ban className="size-4" aria-hidden="true" />
                Zrušit událost
              </Button>
            ) : null}
            {item.permissions.canDelete ? (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Smazat
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card className="p-5">
          <h2 className="text-section-title font-semibold">Podrobnosti</h2>
          <dl className="mt-4 grid gap-4 text-body-sm">
            <div>
              <dt className="text-text-muted">Čas</dt>
              <dd className="mt-1 flex items-start gap-2 font-medium">
                <CalendarClock className="mt-0.5 size-4" aria-hidden="true" />
                {formatCalendarInterval({
                  startsAt: item.startsAt,
                  endsAt: item.endsAt,
                  allDayStartDate: item.allDayStartDate,
                  allDayEndDateExclusive: item.allDayEndDateExclusive,
                  timezone: item.timezone,
                  isAllDay: item.isAllDay,
                })}
                {item.spansMidnight ? ' (+1 den nebo více)' : ''}
              </dd>
            </div>
            {item.location ? (
              <div>
                <dt className="text-text-muted">Místo</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <MapPin className="size-4" aria-hidden="true" />
                  {item.location}
                </dd>
              </div>
            ) : null}
            {item.locationNotes ? (
              <div>
                <dt className="text-text-muted">Pokyny k místu</dt>
                <dd className="mt-1 whitespace-pre-wrap">
                  {item.locationNotes}
                </dd>
              </div>
            ) : null}
            {item.description ? (
              <div>
                <dt className="text-text-muted">Poznámka</dt>
                <dd className="mt-1 whitespace-pre-wrap">{item.description}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
        <Card className="p-5">
          <h2 className="text-section-title font-semibold">Účastníci</h2>
          <div className="mt-4 grid gap-3">
            {item.participants.map(({ role, user }) => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar
                  imageUrl={user.avatarUrl}
                  name={user.displayName ?? user.email ?? 'Člen'}
                />
                <div>
                  <p className="font-medium">
                    {user.displayName ?? user.email}
                  </p>
                  <p className="text-caption text-text-muted">
                    {role === 'ASSIGNEE' ? 'Přiřazený člen' : 'Účastník'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        {travelPlans.data?.items.length ? (
          <Card className="p-5 lg:col-span-2">
            <h2 className="mb-4 text-section-title font-semibold">
              Odhad cesty
            </h2>
            <div className="grid gap-3">
              {travelPlans.data.items.map((plan) => (
                <RouteEstimateSummary key={plan.id} plan={plan} />
              ))}
            </div>
          </Card>
        ) : null}
      </div>
      <CalendarEventDeleteDialog
        event={item}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        pending={deleteEvent.isPending}
        error={deleteEvent.isError ? deleteEvent.error.message : null}
        onConfirm={() =>
          deleteEvent.mutate(eventId, {
            onSuccess: () => {
              setDeleteOpen(false);
              workspace.navigate({ area: 'calendar', screen: 'calendar' });
            },
          })
        }
      />
    </div>
  );
}
