import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { useCreateTask } from '../../hooks/useTaskMutations.js';
import { taskErrorMessage } from '../../lib/taskErrorMessage.js';
import type { TaskMember, TaskCategory } from '../../types/task.types.js';
import { TaskForm } from '../forms/TaskForm.js';

export function TaskCreateDialog({
  open,
  onOpenChange,
  members,
  categories,
  quick = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: TaskMember[];
  categories: TaskCategory[];
  quick?: boolean;
}) {
  const create = useCreateTask();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !create.isPending && onOpenChange(next)}
      title={quick ? 'Rychle přidat úkol' : 'Nový úkol'}
      description={
        quick
          ? 'Základní údaje můžete později doplnit v detailu.'
          : 'Přidejte povinnost, termín nebo opakovaný úkol domácnosti.'
      }
      size={quick ? 'md' : 'lg'}
      mobileFullScreen
    >
      <TaskForm
        members={members}
        categories={categories}
        quick={quick}
        loading={create.isPending}
        error={create.isError ? taskErrorMessage(create.error) : null}
        onCancel={() => onOpenChange(false)}
        onSubmit={(input) =>
          create.mutate(input, { onSuccess: () => onOpenChange(false) })
        }
      />
    </Dialog>
  );
}
