import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../components/ui/LoadingScreen/LoadingScreen.js';
import { TaskCategoriesDialog } from '../components/dialogs/TaskCategoriesDialog.js';
import { TaskCompleteDialog } from '../components/dialogs/TaskCompleteDialog.js';
import { TaskFiltersDialog } from '../components/dialogs/TaskFiltersDialog.js';
import { TasksEmptyState } from '../components/list/TasksEmptyState.js';
import { TasksPagination } from '../components/list/TasksPagination.js';
import { TasksToolbar } from '../components/list/TasksToolbar.js';
import { TaskList } from '../components/list/TaskList.js';
import type { TaskFilterValues } from '../components/list/TaskFilters.js';
import { useTasks } from '../hooks/useTasks.js';
import { useTaskCategories } from '../hooks/useTaskCategories.js';
import { taskErrorMessage } from '../lib/taskErrorMessage.js';
import { TaskSchedulingDialog } from '../../scheduling/components/TaskSchedulingDialog.js';
import type {
  Task,
  TaskView,
  HouseholdRole,
  TaskPriority,
} from '../types/task.types.js';

export function TasksPage({ role }: { role: HouseholdRole }) {
  const workspace = useWorkspaceNavigation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [completion, setCompletion] = useState<Task | null>(null);
  const [scheduling, setScheduling] = useState<Task | null>(null);
  const [listState, setListState] = useState({
    view: 'all' as TaskView,
    page: 1,
    pageSize: 20 as 10 | 20 | 50 | 100,
    query: '',
    priority: '' as TaskPriority | '',
    assignedToUserId: '',
    categoryId: '',
  });
  const {
    view,
    page,
    pageSize,
    query,
    priority,
    assignedToUserId,
    categoryId,
  } = listState;
  const tasks = useTasks({
    view,
    page,
    pageSize,
    ...(query ? { query } : {}),
    ...(priority ? { priority } : {}),
    ...(assignedToUserId ? { assignedToUserId } : {}),
    ...(categoryId ? { categoryId } : {}),
  });
  const categories = useTaskCategories();
  const update = (patch: Record<string, string | number>, resetPage = true) => {
    setListState(
      (current) =>
        ({
          ...current,
          ...patch,
          ...(resetPage ? { page: 1 } : {}),
        }) as typeof current,
    );
  };
  const filterValues: TaskFilterValues = {
    priority,
    assignedToUserId,
    categoryId,
    pageSize,
  };
  const canMutate = role !== 'VIEWER';
  const canManageCategories = role === 'OWNER' || role === 'ADMIN';

  return (
    <div className="grid gap-6">
      <TasksToolbar
        view={view}
        query={query}
        canCreate={canMutate}
        onViewChange={(value) => update({ view: value })}
        onQueryChange={(value) => update({ query: value })}
        onCreate={() => workspace.openOverlay({ kind: 'task-create' })}
        onFilters={() => setFiltersOpen(true)}
      />
      {canManageCategories ? (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => setCategoriesOpen(true)}>
            <Settings2 className="size-4" aria-hidden="true" />
            Spravovat kategorie
          </Button>
        </div>
      ) : null}
      {tasks.isLoading ? <LoadingScreen message="Načítáme úkoly…" /> : null}
      {tasks.isError ? (
        <InlineAlert variant="danger">
          {taskErrorMessage(tasks.error)}
        </InlineAlert>
      ) : null}
      {tasks.data?.items.length === 0 ? (
        canMutate ? (
          <TasksEmptyState
            onCreate={() => workspace.openOverlay({ kind: 'task-create' })}
          />
        ) : (
          <TasksEmptyState />
        )
      ) : null}
      {tasks.data?.items.length ? (
        <TaskList
          tasks={tasks.data.items}
          completingId={null}
          onComplete={setCompletion}
          onSchedule={setScheduling}
        />
      ) : null}
      {tasks.data ? (
        <TasksPagination
          page={tasks.data.pagination.page}
          totalPages={tasks.data.pagination.totalPages}
          onChange={(value) => update({ page: value }, false)}
        />
      ) : null}
      <TaskFiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        values={filterValues}
        members={tasks.data?.members ?? []}
        categories={categories.data ?? []}
        onChange={(patch) => update(patch)}
        onReset={() =>
          update({
            priority: '',
            assignedToUserId: '',
            categoryId: '',
            pageSize: 20,
          })
        }
      />
      <TaskCategoriesDialog
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
        categories={categories.data ?? []}
      />
      <TaskCompleteDialog
        task={completion}
        open={Boolean(completion)}
        onOpenChange={(open) => !open && setCompletion(null)}
      />
      <TaskSchedulingDialog
        task={scheduling}
        open={Boolean(scheduling)}
        onOpenChange={(open) => !open && setScheduling(null)}
      />
    </div>
  );
}
