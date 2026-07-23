import type {
  TaskFormErrors,
  TaskFormValues,
} from '../../schemas/taskForm.schema.js';
import { TaskDueDateField } from './TaskDueDateField.js';

export function TaskScheduleFields({
  values,
  errors,
  onChange,
}: {
  values: TaskFormValues;
  errors: TaskFormErrors;
  onChange: (patch: Partial<TaskFormValues>) => void;
}) {
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-3 text-section-title font-semibold">
        2. Termín
      </legend>
      <TaskDueDateField values={values} errors={errors} onChange={onChange} />
    </fieldset>
  );
}
