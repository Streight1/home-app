import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import { useState } from 'react';
import { useCompleteTask } from '../../hooks/useTaskMutations.js';
import { taskErrorMessage } from '../../lib/taskErrorMessage.js';
import type { Task } from '../../types/task.types.js';

export function TaskCompleteDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [note, setNote] = useState('');
  const complete = useCompleteTask();
  if (!task) return null;
  const next = task.recurrence.nextOccurrenceAt;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Dokončit úkol"
      description={task.title}
      size="sm"
      mobileFullScreen
    >
      {task.recurrence.frequency !== 'NONE' ? (
        <div className="mb-4 rounded-md border border-primary/30 bg-primary-soft p-3 text-body-sm text-text">
          {next
            ? `Další termín: ${new Date(next).toLocaleString('cs-CZ')}`
            : 'Tímto dokončíte poslední výskyt série.'}
        </div>
      ) : null}
      <Textarea
        label="Poznámka k dokončení"
        value={note}
        maxLength={5_000}
        onChange={(event) => setNote(event.target.value)}
      />
      {complete.isError ? (
        <p className="mt-3 text-body-sm text-danger">
          {taskErrorMessage(complete.error)}
        </p>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={() => onOpenChange(false)}>Zrušit</Button>
        <Button
          variant="primary"
          loading={complete.isPending}
          onClick={() =>
            complete.mutate(
              { taskId: task.id, note },
              {
                onSuccess: () => {
                  setNote('');
                  onOpenChange(false);
                },
              },
            )
          }
        >
          Dokončit
        </Button>
      </div>
    </Dialog>
  );
}
