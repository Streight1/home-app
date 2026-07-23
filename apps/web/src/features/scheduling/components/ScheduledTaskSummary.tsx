import { useState } from 'react';
import { CalendarDays, CalendarX2, RefreshCw } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../components/ui/Button/Button.js';
import { Card } from '../../../components/ui/Card/Card.js';
import { Dialog } from '../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { taskErrorMessage } from '../../tasks/lib/taskErrorMessage.js';
import type { Task } from '../../tasks/types/task.types.js';
import { useUnscheduleTask } from '../hooks/useTaskScheduling.js';

const formatter = new Intl.DateTimeFormat('cs-CZ', {
  dateStyle: 'long',
  timeStyle: 'short',
});

export function ScheduledTaskSummary({
  task,
  onReschedule,
}: {
  task: Task;
  onReschedule: () => void;
}) {
  const workspace = useWorkspaceNavigation();
  const unschedule = useUnscheduleTask();
  const [intent, setIntent] = useState<'remove' | 'reschedule' | null>(null);
  const schedule = task.calendarSchedule;
  if (!schedule) return null;
  const confirm = () => {
    unschedule.mutate(task.id, {
      onSuccess: () => {
        const shouldReschedule = intent === 'reschedule';
        setIntent(null);
        if (shouldReschedule) onReschedule();
      },
    });
  };
  return (
    <>
      <Card className="grid gap-4 p-5">
        <div>
          <p className="text-label text-primary">Naplánováno v kalendáři</p>
          <p className="mt-1 text-body-sm font-medium">
            {formatter.format(new Date(schedule.startsAt))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              workspace.navigate({
                area: 'calendar',
                screen: 'detail',
                eventId: schedule.eventId,
              })
            }
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Zobrazit v kalendáři
          </Button>
          {task.permissions.canUnschedule ? (
            <>
              <Button variant="ghost" onClick={() => setIntent('reschedule')}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Přeplánovat
              </Button>
              <Button variant="ghost" onClick={() => setIntent('remove')}>
                <CalendarX2 className="size-4" aria-hidden="true" />
                Odebrat z kalendáře
              </Button>
            </>
          ) : null}
        </div>
      </Card>
      <Dialog
        open={intent !== null}
        onOpenChange={(open) =>
          !open && !unschedule.isPending && setIntent(null)
        }
        title={
          intent === 'reschedule' ? 'Přeplánovat úkol' : 'Odebrat z kalendáře'
        }
        description="Propojená událost bude zrušena. Samotný úkol a jeho historie zůstanou zachované."
        size="sm"
      >
        {unschedule.isError ? (
          <InlineAlert variant="danger">
            {taskErrorMessage(unschedule.error)}
          </InlineAlert>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIntent(null)}>
            Zpět
          </Button>
          <Button
            variant="danger"
            loading={unschedule.isPending}
            onClick={confirm}
          >
            {intent === 'reschedule'
              ? 'Odebrat a navrhnout nový čas'
              : 'Odebrat'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
