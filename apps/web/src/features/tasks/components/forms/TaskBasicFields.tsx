import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import type {
  TaskFormErrors,
  TaskFormValues,
} from '../../schemas/taskForm.schema.js';

export function TaskBasicFields({
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
        1. Základní údaje
      </legend>
      <Input
        label="Název"
        value={values.title}
        {...(errors.title ? { error: errors.title } : {})}
        maxLength={200}
        autoFocus
        onChange={(event) => onChange({ title: event.target.value })}
      />
      <Textarea
        label="Popis"
        value={values.description}
        {...(errors.description ? { error: errors.description } : {})}
        maxLength={5_000}
        onChange={(event) => onChange({ description: event.target.value })}
      />
      <Select
        label="Priorita"
        value={values.priority}
        onChange={(event) =>
          onChange({
            priority: event.target.value as TaskFormValues['priority'],
          })
        }
      >
        <option value="LOW">Nízká</option>
        <option value="NORMAL">Normální</option>
        <option value="HIGH">Vysoká</option>
        <option value="URGENT">Urgentní</option>
      </Select>
    </fieldset>
  );
}
