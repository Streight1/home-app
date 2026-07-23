import type { ReactNode } from 'react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { useTasks } from '../../hooks/useTasks.js';
import { useTaskCategories } from '../../hooks/useTaskCategories.js';
import { TaskCreateDialog } from './TaskCreateDialog.js';

export function TaskQuickCreate({
  trigger,
}: {
  trigger: (open: () => void) => ReactNode;
}) {
  const workspace = useWorkspaceNavigation();
  const open = workspace.overlay?.kind === 'task-create';
  const tasks = useTasks({ view: 'all', page: 1, pageSize: 10 });
  const categories = useTaskCategories();
  return (
    <>
      {trigger(() => workspace.openOverlay({ kind: 'task-create' }))}
      <TaskCreateDialog
        open={open}
        onOpenChange={(next) => !next && workspace.closeOverlay()}
        members={tasks.data?.members ?? []}
        categories={categories.data ?? []}
        quick
      />
    </>
  );
}
