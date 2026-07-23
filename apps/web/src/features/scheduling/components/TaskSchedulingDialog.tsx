import { useState } from 'react';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../components/ui/Button/Button.js';
import { Dialog } from '../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { ApiError } from '../../../lib/api/apiError.js';
import { taskErrorMessage } from '../../tasks/lib/taskErrorMessage.js';
import type { Task } from '../../tasks/types/task.types.js';
import {
  useConfirmTaskSlot,
  useTaskSlotSuggestions,
} from '../hooks/useTaskScheduling.js';
import type { SchedulingInput } from '../types/scheduling.types.js';
import { SchedulingCandidateList } from './SchedulingCandidateList.js';
import { SchedulingWindowFields } from './SchedulingWindowFields.js';

const localDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
};

const nextDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + 1, 12);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
};

export function TaskSchedulingDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const workspace = useWorkspaceNavigation();
  const suggestions = useTaskSlotSuggestions();
  const confirm = useConfirmTaskSlot();
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState<SchedulingInput>({
    date: localDate(),
    earliestTime: '06:00',
    latestTime: '22:00',
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Prague',
    routeMode: 'CAR_FAST_TRAFFIC',
    travelBufferMinutes: 10,
    considerTravel: true,
    suggestionCount: 5,
  });
  if (!task) return null;
  const handleOpenChange = (next: boolean) => {
    if (confirm.isPending) return;
    if (!next) {
      suggestions.reset();
      confirm.reset();
      setSelected(null);
    }
    onOpenChange(next);
  };
  const find = () => {
    setSelected(null);
    suggestions.mutate({ taskId: task.id, input });
  };
  const findWith = (next: SchedulingInput) => {
    setInput(next);
    setSelected(null);
    suggestions.mutate({ taskId: task.id, input: next });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Naplánovat do kalendáře"
      description={`${task.title} · návrh nikdy nevytvoří událost bez vašeho potvrzení.`}
      size="wide"
      mobileFullScreen
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.75fr)_minmax(28rem,1.25fr)]">
        <div className="grid content-start gap-4">
          <SchedulingWindowFields
            value={input}
            onChange={(next) => {
              const dateChanged = next.date !== input.date;
              setInput(next);
              if (dateChanged && suggestions.data) {
                setSelected(null);
                suggestions.mutate({ taskId: task.id, input: next });
              }
            }}
          />
          <Button
            variant="secondary"
            loading={suggestions.isPending}
            onClick={find}
          >
            Navrhnout časy
          </Button>
          {!task.estimatedDurationMinutes ? (
            <InlineAlert variant="warning">
              Nejprve doplňte předpokládanou délku úkolu.
            </InlineAlert>
          ) : null}
          {suggestions.isError ? (
            <InlineAlert variant="danger">
              {taskErrorMessage(suggestions.error)}
            </InlineAlert>
          ) : null}
        </div>
        <div className="grid content-start gap-4">
          {suggestions.data ? (
            <SchedulingCandidateList
              result={suggestions.data}
              selectedToken={selected}
              onSelect={setSelected}
              onWithoutTravel={() =>
                findWith({ ...input, considerTravel: false })
              }
              onTomorrow={() =>
                findWith({ ...input, date: nextDate(input.date) })
              }
              onExpandWindow={() =>
                findWith({
                  ...input,
                  earliestTime: '00:00',
                  latestTime: '23:59',
                })
              }
            />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-text-muted">
              Nastavte období a nechte si navrhnout společný volný čas.
            </p>
          )}
          {confirm.isError ? (
            <InlineAlert variant="danger">
              {taskErrorMessage(confirm.error)}
            </InlineAlert>
          ) : null}
          {selected ? (
            <div className="sticky bottom-0 flex justify-end border-t border-border bg-surface-raised pt-4">
              <Button
                variant="primary"
                disabled={!selected}
                loading={confirm.isPending}
                onClick={() => {
                  if (!selected) return;
                  confirm.mutate(
                    { taskId: task.id, candidateToken: selected },
                    {
                      onSuccess: ({ eventId }) => {
                        onOpenChange(false);
                        workspace.navigate({
                          area: 'calendar',
                          screen: 'detail',
                          eventId,
                        });
                      },
                      onError: (error) => {
                        if (
                          error instanceof ApiError &&
                          error.code === 'SCHEDULING_SLOT_CHANGED'
                        ) {
                          setSelected(null);
                          suggestions.mutate({ taskId: task.id, input });
                        }
                      },
                    },
                  );
                }}
              >
                Vložit do kalendáře
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
