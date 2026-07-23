import { Card } from '../../../../components/ui/Card/Card.js';
import { formatTaskDue, priorityLabels } from '../../lib/taskDate.js';
import type { Task } from '../../types/task.types.js';
import { TaskCompletionHistory } from './TaskCompletionHistory.js';
import { TaskLinkedDocuments } from './TaskLinkedDocuments.js';
import { TaskParticipantStack } from '../list/TaskParticipantStack.js';
import { formatTaskDuration } from '../../lib/taskFormatting.js';

const recurrenceLabels = {
  NONE: 'Neopakovat',
  DAILY: 'Denně',
  WEEKLY: 'Týdně',
  MONTHLY: 'Měsíčně',
  YEARLY: 'Ročně',
} as const;

export function TaskDetail({ task }: { task: Task }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid content-start gap-6">
        <Card className="p-5">
          <h2 className="text-section-title font-semibold">Popis</h2>
          <p className="mt-3 whitespace-pre-wrap text-body-sm leading-6 text-text-secondary">
            {task.description ?? 'Úkol nemá doplněný popis.'}
          </p>
        </Card>
        <TaskLinkedDocuments documents={task.documents} />
        <TaskCompletionHistory completions={task.completions} />
      </div>
      <Card className="h-fit p-5">
        <h2 className="text-section-title font-semibold">Podrobnosti</h2>
        <dl className="mt-4 grid gap-4 text-body-sm">
          <div>
            <dt className="text-text-muted">Termín</dt>
            <dd className="mt-1 font-medium">{formatTaskDue(task)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Priorita</dt>
            <dd className="mt-1 font-medium">
              {priorityLabels[task.priority]}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Přiřazení</dt>
            <dd className="mt-1 font-medium">
              <TaskParticipantStack participants={task.participants} />
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Předpokládaná délka</dt>
            <dd className="mt-1 font-medium">
              {task.estimatedDurationMinutes
                ? formatTaskDuration(task.estimatedDurationMinutes)
                : 'Neuvedena'}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Místo</dt>
            <dd className="mt-1 font-medium">
              {task.location?.label ?? 'Bez místa'}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Kategorie</dt>
            <dd className="mt-1 font-medium">
              {task.category?.name ?? 'Bez kategorie'}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Opakování</dt>
            <dd className="mt-1 font-medium">
              {recurrenceLabels[task.recurrence.frequency]}
              {task.recurrence.frequency !== 'NONE' &&
              task.recurrence.interval > 1
                ? ` · interval ${String(task.recurrence.interval)}`
                : ''}
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Časové pásmo</dt>
            <dd className="mt-1 font-medium">{task.timezone}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
