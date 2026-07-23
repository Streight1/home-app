import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { useCancelTask } from '../../hooks/useTaskMutations.js';
import { taskErrorMessage } from '../../lib/taskErrorMessage.js';
import type { Task } from '../../types/task.types.js';

export function TaskCancelDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cancel = useCancelTask();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Zrušit úkol?"
      description="Úkol zůstane v historii jako zrušený."
      size="sm"
    >
      {cancel.isError ? (
        <p className="mb-3 text-body-sm text-danger">
          {taskErrorMessage(cancel.error)}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button onClick={() => onOpenChange(false)}>Ponechat otevřený</Button>
        <Button
          variant="danger"
          loading={cancel.isPending}
          onClick={() =>
            cancel.mutate(task.id, { onSuccess: () => onOpenChange(false) })
          }
        >
          Zrušit úkol
        </Button>
      </div>
    </Dialog>
  );
}
