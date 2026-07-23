import { Input } from '../../../../components/ui/Input/Input.js';
import type {
  TaskFormErrors,
  TaskFormValues,
} from '../../schemas/taskForm.schema.js';
import { TaskDueDatePicker } from './TaskDueDatePicker.js';
import { TaskDueQuickActions } from './TaskDueQuickActions.js';

export function TaskDueDateField({
  values,
  errors,
  onChange,
}: {
  values: TaskFormValues;
  errors: TaskFormErrors;
  onChange: (patch: Partial<TaskFormValues>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TaskDueDatePicker
        value={values.dueDate}
        {...(errors.dueDate ? { error: errors.dueDate } : {})}
        onChange={(dueDate) => onChange({ dueDate })}
      />
      <Input
        label="Čas (volitelný)"
        type="time"
        value={values.dueTime}
        disabled={!values.dueDate}
        hint={
          values.dueDate
            ? 'Bez času zůstane úkol platný pro celý den.'
            : 'Nejprve vyberte datum.'
        }
        onChange={(event) => onChange({ dueTime: event.target.value })}
      />
      <div className="md:col-span-2">
        <TaskDueQuickActions onChange={onChange} />
      </div>
    </div>
  );
}
