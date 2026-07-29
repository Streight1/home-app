import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import { maintenancePriorityLabels } from '../../lib/maintenanceFormat.js';
import type { MaintenancePlanFieldProps } from './MaintenancePlanForm.types.js';

export function MaintenancePlanBasicFields({
  value,
  categories,
  update,
}: MaintenancePlanFieldProps) {
  return (
    <section className="grid gap-4">
      <h3 className="text-body font-semibold">Základní údaje</h3>
      <Input
        label="Název"
        required
        maxLength={200}
        value={value.title}
        onChange={(event) => update({ title: event.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Kategorie"
          value={value.categoryId ?? ''}
          onChange={(event) =>
            update({ categoryId: event.target.value || null })
          }
        >
          <option value="">Bez kategorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          label="Priorita"
          value={value.priority}
          onChange={(event) =>
            update({
              priority: event.target
                .value as MaintenancePlanFieldProps['value']['priority'],
            })
          }
        >
          {Object.entries(maintenancePriorityLabels).map(
            ([priority, label]) => (
              <option key={priority} value={priority}>
                {label}
              </option>
            ),
          )}
        </Select>
      </div>
      <Textarea
        label="Popis"
        value={value.description ?? ''}
        onChange={(event) =>
          update({ description: event.target.value || null })
        }
      />
      <Textarea
        label="Pokyny"
        hint="Bez formátovaného HTML."
        value={value.instructions ?? ''}
        onChange={(event) =>
          update({ instructions: event.target.value || null })
        }
      />
    </section>
  );
}
