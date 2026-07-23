import { Fragment } from 'react';
import type { Task } from '../../types/task.types.js';
import { TaskDesktopRow } from './TaskDesktopRow.js';
import { TaskMobileCard } from './TaskMobileCard.js';

export function TaskList({
  tasks,
  completingId,
  onComplete,
  onSchedule,
}: {
  tasks: Task[];
  completingId: string | null;
  onComplete: (task: Task) => void;
  onSchedule?: (task: Task) => void;
}) {
  return (
    <ul
      className="overflow-hidden rounded-lg border border-border bg-surface"
      aria-label="Seznam úkolů"
    >
      {tasks.map((task) => (
        <Fragment key={task.id}>
          <TaskDesktopRow
            task={task}
            completing={completingId === task.id}
            onComplete={onComplete}
            {...(onSchedule ? { onSchedule } : {})}
          />
          <TaskMobileCard
            task={task}
            completing={completingId === task.id}
            onComplete={onComplete}
            {...(onSchedule ? { onSchedule } : {})}
          />
        </Fragment>
      ))}
    </ul>
  );
}
