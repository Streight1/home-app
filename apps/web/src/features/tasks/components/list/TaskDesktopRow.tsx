import { Clock3, FileText, MapPin, Repeat2 } from 'lucide-react';
import { WorkspaceLink } from '../../../../app/workspace-navigation/WorkspaceLink.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { formatTaskDue } from '../../lib/taskDate.js';
import type { Task } from '../../types/task.types.js';
import { TaskPriorityBadge } from './TaskPriorityBadge.js';
import { TaskParticipantStack } from './TaskParticipantStack.js';
import { formatTaskDuration } from '../../lib/taskFormatting.js';

interface Props {
  task: Task;
  completing: boolean;
  onComplete: (task: Task) => void;
  onSchedule?: (task: Task) => void;
}

export function TaskDesktopRow({
  task,
  completing,
  onComplete,
  onSchedule,
}: Props) {
  return (
    <li className="hidden min-h-16 grid-cols-[auto_minmax(0,1fr)_minmax(9rem,auto)_minmax(8rem,auto)_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 md:grid">
      {task.permissions.canComplete ? (
        <button
          type="button"
          className="size-11 rounded-full border border-border-strong text-text-muted hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus disabled:opacity-50"
          aria-label={`Dokončit úkol ${task.title}`}
          disabled={completing}
          onClick={() => onComplete(task)}
        >
          <span aria-hidden="true">✓</span>
        </button>
      ) : (
        <span
          className="size-3 rounded-full border border-border"
          aria-hidden="true"
        />
      )}
      <div className="min-w-0">
        <WorkspaceLink
          view={{ area: 'tasks', screen: 'detail', taskId: task.id }}
          className="font-semibold text-text hover:text-primary-emphasis focus-visible:outline-2 focus-visible:outline-focus"
        >
          {task.title}
        </WorkspaceLink>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-caption text-text-muted">
          <TaskPriorityBadge priority={task.priority} />
          {task.recurrence.frequency !== 'NONE' ? (
            <span className="inline-flex items-center gap-1">
              <Repeat2 className="size-3.5" aria-hidden="true" />
              Opakuje se
            </span>
          ) : null}
          {task.documentCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3.5" aria-hidden="true" />
              {task.documentCount}
            </span>
          ) : null}
          {task.estimatedDurationMinutes ? (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {formatTaskDuration(task.estimatedDurationMinutes)}
            </span>
          ) : null}
          {task.location?.label ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{task.location.label}</span>
            </span>
          ) : null}
        </div>
      </div>
      <span
        className={
          task.timing === 'OVERDUE'
            ? 'font-medium text-danger'
            : 'text-text-secondary'
        }
      >
        {formatTaskDue(task)}
      </span>
      <span className="truncate text-body-sm text-text-muted">
        <TaskParticipantStack participants={task.participants} />
      </span>
      <span className="flex items-center gap-1">
        {task.permissions.canSchedule && onSchedule ? (
          <Button variant="ghost" onClick={() => onSchedule(task)}>
            Naplánovat
          </Button>
        ) : null}
        {task.permissions.canComplete ? (
          <Button
            variant="ghost"
            onClick={() => onComplete(task)}
            disabled={completing}
          >
            Dokončit
          </Button>
        ) : null}
      </span>
    </li>
  );
}
