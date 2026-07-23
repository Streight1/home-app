import {
  ArrowLeft,
  Archive,
  Check,
  Pencil,
  CalendarPlus,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { WorkspaceLink } from '../../../../app/workspace-navigation/WorkspaceLink.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import type { Task } from '../../types/task.types.js';

export function TaskDetailHeader({
  task,
  onEdit,
  onComplete,
  onReopen,
  onCancel,
  onArchive,
  onSchedule,
}: {
  task: Task;
  onEdit: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onCancel: () => void;
  onArchive: () => void;
  onSchedule: () => void;
}) {
  return (
    <header className="grid gap-4">
      <WorkspaceLink
        view={{ area: 'tasks', screen: 'list' }}
        className="inline-flex min-h-11 w-fit items-center gap-2 text-body-sm text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Zpět na úkoly
      </WorkspaceLink>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge
            variant={
              task.status === 'COMPLETED'
                ? 'success'
                : task.timing === 'OVERDUE'
                  ? 'warning'
                  : 'neutral'
            }
          >
            {task.status === 'OPEN'
              ? 'Otevřený'
              : task.status === 'COMPLETED'
                ? 'Dokončený'
                : task.status === 'CANCELLED'
                  ? 'Zrušený'
                  : 'Archivovaný'}
          </Badge>
          <h1 className="mt-3 break-words text-page-title font-semibold tracking-tight">
            {task.title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {task.permissions.canSchedule ? (
            <Button variant="secondary" onClick={onSchedule}>
              <CalendarPlus className="size-4" aria-hidden="true" />
              Naplánovat do kalendáře
            </Button>
          ) : null}
          {task.permissions.canEdit &&
          task.status === 'OPEN' &&
          !task.calendarSchedule &&
          !task.estimatedDurationMinutes ? (
            <Button variant="secondary" onClick={onEdit}>
              <CalendarPlus className="size-4" aria-hidden="true" />
              Doplnit délku pro plánování
            </Button>
          ) : null}
          {task.permissions.canEdit ? (
            <Button onClick={onEdit}>
              <Pencil className="size-4" aria-hidden="true" />
              Upravit
            </Button>
          ) : null}
          {task.permissions.canComplete ? (
            <Button variant="primary" onClick={onComplete}>
              <Check className="size-4" aria-hidden="true" />
              Dokončit
            </Button>
          ) : null}
          {task.permissions.canReopen ? (
            <Button onClick={onReopen}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Znovu otevřít
            </Button>
          ) : null}
          {task.permissions.canCancel ? (
            <Button variant="ghost" onClick={onCancel}>
              <XCircle className="size-4" aria-hidden="true" />
              Zrušit
            </Button>
          ) : null}
          {task.permissions.canArchive ? (
            <Button variant="ghost" onClick={onArchive}>
              <Archive className="size-4" aria-hidden="true" />
              Archivovat
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
