import { Select } from '../../../../components/ui/Select/Select.js';
import type { TaskCategory } from '../../types/task.types.js';
import type { TaskFormValues } from '../../schemas/taskForm.schema.js';

export function TaskAssignmentFields({
  values,
  categories,
  onChange,
}: {
  values: TaskFormValues;
  categories: TaskCategory[];
  onChange: (patch: Partial<TaskFormValues>) => void;
}) {
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-3 text-section-title font-semibold">
        6. Kategorie
      </legend>
      <Select
        label="Kategorie"
        value={values.categoryId}
        onChange={(event) => onChange({ categoryId: event.target.value })}
      >
        <option value="">Bez kategorie</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
    </fieldset>
  );
}
