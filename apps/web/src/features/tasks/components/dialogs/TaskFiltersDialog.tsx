import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import type { TaskMember, TaskCategory } from '../../types/task.types.js';
import { TaskFilters, type TaskFilterValues } from '../list/TaskFilters.js';

export function TaskFiltersDialog({
  open,
  onOpenChange,
  values,
  members,
  categories,
  onChange,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: TaskFilterValues;
  members: TaskMember[];
  categories: TaskCategory[];
  onChange: (patch: Partial<TaskFilterValues>) => void;
  onReset: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Filtry úkolů"
      size="sm"
      mobileFullScreen
    >
      <TaskFilters
        values={values}
        members={members}
        categories={categories}
        onChange={onChange}
        onReset={onReset}
      />
    </Dialog>
  );
}
