import { AlertTriangle, ArrowRight, Check, ListTodo, Plus } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { dateOnlyToLocalDate } from '../../../../lib/date/dateOnly.js';
import { useTasksDashboard } from '../../hooks/useTasksDashboard.js';
import { useCompleteTask } from '../../hooks/useTaskMutations.js';
import { taskErrorMessage } from '../../lib/taskErrorMessage.js';
import type { TaskDashboard } from '../../types/task.types.js';

function dueLabel(item: TaskDashboard['items'][number]) {
  if (!item.dueDate) return 'Bez termínu';
  const date = dateOnlyToLocalDate(item.dueDate);
  const formatted = date.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
  });
  const time =
    item.dueTimeMinutes === null
      ? ''
      : ` v ${String(Math.floor(item.dueTimeMinutes / 60)).padStart(2, '0')}:${String(item.dueTimeMinutes % 60).padStart(2, '0')}`;
  const label = `${formatted}${time}`;
  return item.isOverdue ? `Po termínu · ${label}` : label;
}

export function TasksDashboardWidget({
  initialData,
}: {
  initialData?: TaskDashboard;
}) {
  const workspace = useWorkspaceNavigation();
  const dashboard = useTasksDashboard(initialData);
  const complete = useCompleteTask();
  const data = dashboard.data;
  const openAll = () => workspace.navigate({ area: 'tasks', screen: 'list' });
  return (
    <section className="md:col-span-12" aria-labelledby="tasks-dashboard-title">
      <div className="rounded-lg border border-border bg-surface-raised p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              Společná domácnost
            </p>
            <h2
              id="tasks-dashboard-title"
              className="mt-1 text-section-title font-semibold"
            >
              Úkoly
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-body-sm font-medium text-primary-emphasis focus-visible:outline-2 focus-visible:outline-focus"
              onClick={() => workspace.openOverlay({ kind: 'task-create' })}
            >
              <Plus className="size-4" aria-hidden="true" /> Přidat úkol
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-body-sm font-medium text-primary-emphasis focus-visible:outline-2 focus-visible:outline-focus"
              onClick={openAll}
            >
              Zobrazit vše <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        {dashboard.isError ? (
          <div className="mt-4">
            <InlineAlert variant="danger">
              <span>{taskErrorMessage(dashboard.error)}</span>
              <button
                type="button"
                className="ml-3 min-h-11 rounded-md px-3 font-medium underline decoration-current underline-offset-4 focus-visible:outline-2 focus-visible:outline-focus"
                onClick={() => void dashboard.refetch()}
              >
                Zkusit znovu
              </button>
            </InlineAlert>
          </div>
        ) : null}
        {complete.isError ? (
          <div className="mt-4">
            <InlineAlert variant="danger">
              {taskErrorMessage(complete.error)}
            </InlineAlert>
          </div>
        ) : null}
        {data ? (
          <div className="mt-4 flex flex-wrap gap-3 text-body-sm">
            <span className="rounded-md bg-primary-soft px-3 py-2 text-primary-emphasis">
              Otevřené: {data.summary.openTotal}
            </span>
            {data.summary.overdueTotal > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-md bg-danger-soft px-3 py-2 text-danger">
                <AlertTriangle className="size-4" aria-hidden="true" /> Po
                termínu: {data.summary.overdueTotal}
              </span>
            ) : null}
            <span className="rounded-md bg-surface-subtle px-3 py-2 text-text-muted">
              Dnes: {data.summary.dueTodayTotal}
            </span>
          </div>
        ) : null}
        {data && data.items.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              compact
              eyebrow={
                <ListTodo className="mx-auto size-5" aria-hidden="true" />
              }
              title="Nemáte žádné otevřené úkoly."
              description="Nový úkol můžete přidat přímo z tohoto přehledu."
              action={
                <button
                  type="button"
                  className="aurora-primary-action inline-flex min-h-11 items-center rounded-md px-4 text-body-sm font-medium text-primary-foreground"
                  onClick={() => workspace.openOverlay({ kind: 'task-create' })}
                >
                  Přidat úkol
                </button>
              }
            />
          </div>
        ) : null}
        {data?.items.length ? (
          <ul className="mt-4 divide-y divide-border">
            {data.items.map((task) => (
              <li
                key={task.id}
                className="flex min-h-14 items-center gap-3 py-2"
              >
                {task.permissions.canComplete ? (
                  <IconButton
                    variant="ghost"
                    aria-label={`Označit úkol „${task.title}“ jako splněný`}
                    loading={
                      complete.isPending &&
                      complete.variables.taskId === task.id
                    }
                    onClick={() => complete.mutate({ taskId: task.id })}
                  >
                    <Check className="size-5" aria-hidden="true" />
                  </IconButton>
                ) : null}
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="break-words text-left font-medium text-text hover:text-primary-emphasis focus-visible:outline-2 focus-visible:outline-focus"
                    onClick={() => workspace.navigate(task.navigationTarget)}
                  >
                    {task.title}
                  </button>
                  <p
                    className={`text-caption ${task.isOverdue ? 'text-danger' : 'text-text-muted'}`}
                  >
                    {dueLabel(task)}
                    {task.assignedTo
                      ? ` · ${task.assignedTo.displayName ?? task.assignedTo.email}`
                      : ''}
                    {task.isRecurring ? ' · Opakovaně' : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
