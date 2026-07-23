import { Clock3, FileText, MapPin, Repeat2 } from 'lucide-react';
import { WorkspaceLink } from '../../../../app/workspace-navigation/WorkspaceLink.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { formatTaskDue } from '../../lib/taskDate.js';
import type { Task } from '../../types/task.types.js';
import { TaskPriorityBadge } from './TaskPriorityBadge.js';
import { TaskParticipantStack } from './TaskParticipantStack.js';
import { formatTaskDuration } from '../../lib/taskFormatting.js';

export function TaskMobileCard({
  task,
  completing,
  onComplete,
  onSchedule,
}: {
  task: Task;
  completing: boolean;
  onComplete: (task: Task) => void;
  onSchedule?: (task: Task) => void;
}) {
  return (
    <li className="border-b border-border p-4 last:border-b-0 md:hidden">
      <div className="flex items-start gap-3">
        {task.permissions.canComplete ? (
          <button
            type="button"
            className="size-11 shrink-0 rounded-full border border-border-strong text-text-muted focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50"
            aria-label={`Dokončit úkol ${task.title}`}
            disabled={completing}
            onClick={() => onComplete(task)}
          >
            ✓
          </button>
        ) : (
          <span
            className="mt-4 size-3 shrink-0 rounded-full border border-border"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0 flex-1">
          <WorkspaceLink
            view={{ area: 'tasks', screen: 'detail', taskId: task.id }}
            className="font-semibold text-text focus-visible:outline-2 focus-visible:outline-focus"
          >
            {task.title}
          </WorkspaceLink>
          <p
            className={`mt-1 text-body-sm ${task.timing === 'OVERDUE' ? 'font-medium text-danger' : 'text-text-secondary'}`}
          >
            {formatTaskDue(task)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-text-muted">
            <TaskPriorityBadge priority={task.priority} />
            {task.category ? <span>{task.category.name}</span> : null}
            <TaskParticipantStack participants={task.participants} />
            {task.estimatedDurationMinutes ? (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-4" aria-hidden="true" />
                {formatTaskDuration(task.estimatedDurationMinutes)}
              </span>
            ) : null}
            {task.location?.label ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{task.location.label}</span>
              </span>
            ) : null}
            {task.recurrence.frequency !== 'NONE' ? (
              <Repeat2 className="size-4" aria-label="Opakovaný úkol" />
            ) : null}
            {task.documentCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <FileText className="size-4" aria-hidden="true" />
                {task.documentCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {task.permissions.canComplete ? (
        <Button
          className="mt-3 w-full"
          variant="secondary"
          loading={completing}
          onClick={() => onComplete(task)}
        >
          Dokončit
        </Button>
      ) : null}
      {task.permissions.canSchedule && onSchedule ? (
        <Button
          className="mt-2 w-full"
          variant="ghost"
          onClick={() => onSchedule(task)}
        >
          Naplánovat do kalendáře
        </Button>
      ) : null}
    </li>
  );
}
