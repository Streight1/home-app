import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { MaintenanceRecurrenceFields } from './MaintenanceRecurrenceFields.js';
import type { MaintenancePlanFieldProps } from './MaintenancePlanForm.types.js';

export function MaintenancePlanScheduleFields({
  value,
  members,
  update,
}: MaintenancePlanFieldProps) {
  return (
    <section className="grid gap-4">
      <h3 className="text-body font-semibold">Termín a odpovědnost</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <DatePicker
          label="První termín"
          value={value.startsOn}
          onChange={(startsOn) => update({ startsOn })}
        />
        <DatePicker
          label="Konec platnosti"
          value={value.endsOn ?? ''}
          onChange={(endsOn) => update({ endsOn })}
        />
      </div>
      <Select
        label="Odpovědná osoba"
        value={value.responsibleUserId ?? ''}
        onChange={(event) =>
          update({ responsibleUserId: event.target.value || null })
        }
      >
        <option value="">Celá domácnost</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.displayName ?? member.email}
          </option>
        ))}
      </Select>
      <MaintenanceRecurrenceFields
        value={value.recurrence}
        onChange={(recurrence) => update({ recurrence })}
      />
      {value.recurrence.frequency !== 'ONCE' ? (
        <Select
          label="Další termín počítat"
          value={value.recurrenceBasis}
          onChange={(event) =>
            update({
              recurrenceBasis: event.target
                .value as MaintenancePlanFieldProps['value']['recurrenceBasis'],
            })
          }
        >
          <option value="FROM_SCHEDULED_DATE">Z plánovaného termínu</option>
          <option value="FROM_COMPLETION_DATE">Ze skutečného dokončení</option>
        </Select>
      ) : null}
    </section>
  );
}
