import { Button } from '../../../../components/ui/Button/Button.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type {
  TaskMember,
  TaskCategory,
  TaskPriority,
} from '../../types/task.types.js';

export interface TaskFilterValues {
  priority: TaskPriority | '';
  assignedToUserId: string;
  categoryId: string;
  pageSize: 10 | 20 | 50 | 100;
}

export function TaskFilters({
  values,
  members,
  categories,
  onChange,
  onReset,
}: {
  values: TaskFilterValues;
  members: TaskMember[];
  categories: TaskCategory[];
  onChange: (patch: Partial<TaskFilterValues>) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-4">
      <Select
        label="Priorita"
        value={values.priority}
        onChange={(event) =>
          onChange({
            priority: event.target.value as TaskFilterValues['priority'],
          })
        }
      >
        <option value="">Všechny priority</option>
        <option value="LOW">Nízká</option>
        <option value="NORMAL">Normální</option>
        <option value="HIGH">Vysoká</option>
        <option value="URGENT">Urgentní</option>
      </Select>
      <Select
        label="Přiřazení"
        value={values.assignedToUserId}
        onChange={(event) => onChange({ assignedToUserId: event.target.value })}
      >
        <option value="">Všichni členové</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.displayName ?? member.email}
          </option>
        ))}
      </Select>
      <Select
        label="Kategorie"
        value={values.categoryId}
        onChange={(event) => onChange({ categoryId: event.target.value })}
      >
        <option value="">Všechny kategorie</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Select
        label="Položek na stránku"
        value={values.pageSize}
        onChange={(event) =>
          onChange({
            pageSize: Number(
              event.target.value,
            ) as TaskFilterValues['pageSize'],
          })
        }
      >
        {[10, 20, 50, 100].map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Select>
      <Button variant="ghost" onClick={onReset}>
        Vymazat filtry
      </Button>
    </div>
  );
}
