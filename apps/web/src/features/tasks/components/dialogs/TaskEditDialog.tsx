import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { useUpdateTask } from '../../hooks/useTaskMutations.js';
import { taskErrorMessage } from '../../lib/taskErrorMessage.js';
import type { TaskMember, Task, TaskCategory } from '../../types/task.types.js';
import { TaskForm } from '../forms/TaskForm.js';

export function TaskEditDialog({
  task,
  open,
  onOpenChange,
  members,
  categories,
}: {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: TaskMember[];
  categories: TaskCategory[];
}) {
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const update = useUpdateTask(task.id);
  const close = () => {
    if (dirty) setConfirmClose(true);
    else onOpenChange(false);
  };
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => (next ? onOpenChange(true) : close())}
        title="Upravit úkol"
        size="lg"
        mobileFullScreen
      >
        <TaskForm
          task={task}
          members={members}
          categories={categories}
          loading={update.isPending}
          error={update.isError ? taskErrorMessage(update.error) : null}
          onDirtyChange={setDirty}
          onCancel={close}
          onSubmit={(input) =>
            update.mutate(input, {
              onSuccess: () => {
                setDirty(false);
                onOpenChange(false);
              },
            })
          }
        />
      </Dialog>
      <Dialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Zahodit neuložené změny?"
        description="Změny formuláře nebudou uloženy."
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmClose(false)}>
            Pokračovat v úpravách
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmClose(false);
              setDirty(false);
              onOpenChange(false);
            }}
          >
            Zahodit změny
          </Button>
        </div>
      </Dialog>
    </>
  );
}
