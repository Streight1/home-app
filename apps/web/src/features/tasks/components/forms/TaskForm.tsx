import { useMemo, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import {
  emptyTaskFormValues,
  taskInput,
  validateTaskForm,
  type TaskFormValues,
} from '../../schemas/taskForm.schema.js';
import type {
  TaskMember,
  Task,
  TaskCategory,
  TaskInput,
} from '../../types/task.types.js';
import { TaskAssignmentFields } from './TaskAssignmentFields.js';
import { TaskBasicFields } from './TaskBasicFields.js';
import { TaskDocumentPicker } from './TaskDocumentPicker.js';
import { TaskDurationLocationFields } from './TaskDurationLocationFields.js';
import { TaskParticipantSelector } from './TaskParticipantSelector.js';
import { TaskRecurrenceFields } from './TaskRecurrenceFields.js';
import { TaskScheduleFields } from './TaskScheduleFields.js';

function localDateTimeInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  ).toISOString();
  return local.slice(0, 16);
}

function timeInput(minutes: number | null): string {
  if (minutes === null) return '';
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function taskValues(
  task: Task | undefined,
  members: TaskMember[],
): TaskFormValues {
  if (!task)
    return {
      ...emptyTaskFormValues(),
      participantUserIds: members[0] ? [members[0].id] : [],
    };
  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    assignedToUserId: task.assignedTo?.id ?? '',
    participantUserIds: task.participants.map((participant) => participant.id),
    estimatedDurationMinutes: task.estimatedDurationMinutes?.toString() ?? '',
    locationPlaceId: task.location?.placeId ?? '',
    locationLabel: task.location?.label ?? '',
    locationNotes: task.location?.notes ?? '',
    categoryId: task.category?.id ?? '',
    dueDate: task.dueDate ?? '',
    dueTime: timeInput(task.dueTimeMinutes),
    recurrenceFrequency: task.recurrence.frequency,
    recurrenceInterval: String(task.recurrence.interval),
    recurrenceDaysOfWeek: task.recurrence.daysOfWeek,
    recurrenceDayOfMonth: task.recurrence.dayOfMonth
      ? String(task.recurrence.dayOfMonth)
      : '',
    recurrenceMonthOfYear: task.recurrence.monthOfYear
      ? String(task.recurrence.monthOfYear)
      : '',
    recurrenceEndsAt: localDateTimeInput(task.recurrence.endsAt),
    documentIds: task.documents.map((document) => document.id),
  };
}

export function TaskForm({
  task,
  members,
  categories,
  quick = false,
  loading = false,
  error = null,
  onSubmit,
  onCancel,
  onDirtyChange,
}: {
  task?: Task;
  members: TaskMember[];
  categories: TaskCategory[];
  quick?: boolean;
  loading?: boolean;
  error?: string | null;
  onSubmit: (input: TaskInput) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const initial = useMemo(() => taskValues(task, members), [task, members]);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState(() =>
    validateTaskForm({ ...initial, title: initial.title || 'x' }),
  );
  const update = (patch: Partial<TaskFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    onDirtyChange?.(true);
  };
  const submit = () => {
    const nextErrors = validateTaskForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(taskInput(values));
  };
  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {error ? <InlineAlert variant="danger">{error}</InlineAlert> : null}
      <TaskBasicFields values={values} errors={errors} onChange={update} />
      <div className="border-t border-border pt-5">
        <TaskParticipantSelector
          members={members}
          selected={values.participantUserIds}
          {...(errors.participantUserIds
            ? { error: errors.participantUserIds }
            : {})}
          onChange={(participantUserIds) => update({ participantUserIds })}
        />
      </div>
      <div className="border-t border-border pt-5">
        <TaskScheduleFields values={values} errors={errors} onChange={update} />
      </div>
      <div className="border-t border-border pt-5">
        <TaskDurationLocationFields
          values={values}
          errors={errors}
          onChange={update}
        />
      </div>
      {!quick ? (
        <div className="border-t border-border pt-5">
          <TaskRecurrenceFields
            values={values}
            errors={errors}
            onChange={update}
          />
        </div>
      ) : null}
      <div className="border-t border-border pt-5">
        <TaskAssignmentFields
          values={values}
          categories={categories}
          onChange={update}
        />
      </div>
      {!quick ? (
        <div className="border-t border-border pt-5">
          <TaskDocumentPicker
            value={values.documentIds}
            onChange={(documentIds) => update({ documentIds })}
          />
        </div>
      ) : null}
      <div className="sticky bottom-0 -mx-1 flex flex-col-reverse gap-2 border-t border-border bg-surface-raised px-1 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Zrušit
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {task ? 'Uložit změny' : 'Vytvořit úkol'}
        </Button>
      </div>
    </form>
  );
}
