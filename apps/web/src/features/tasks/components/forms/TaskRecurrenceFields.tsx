import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type {
  TaskFormErrors,
  TaskFormValues,
} from '../../schemas/taskForm.schema.js';

const weekdays = [
  [1, 'Po'],
  [2, 'Út'],
  [3, 'St'],
  [4, 'Čt'],
  [5, 'Pá'],
  [6, 'So'],
  [7, 'Ne'],
] as const;

export function TaskRecurrenceFields({
  values,
  errors,
  onChange,
}: {
  values: TaskFormValues;
  errors: TaskFormErrors;
  onChange: (patch: Partial<TaskFormValues>) => void;
}) {
  const recurring = values.recurrenceFrequency !== 'NONE';
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-3 text-section-title font-semibold">
        3. Opakování
      </legend>
      <Select
        label="Frekvence"
        value={values.recurrenceFrequency}
        onChange={(event) =>
          onChange({
            recurrenceFrequency: event.target
              .value as TaskFormValues['recurrenceFrequency'],
          })
        }
      >
        <option value="NONE">Neopakovat</option>
        <option value="DAILY">Denně</option>
        <option value="WEEKLY">Týdně</option>
        <option value="MONTHLY">Měsíčně</option>
        <option value="YEARLY">Ročně</option>
      </Select>
      {recurring ? (
        <Input
          label="Interval"
          type="number"
          min={1}
          max={365}
          value={values.recurrenceInterval}
          {...(errors.recurrenceInterval
            ? { error: errors.recurrenceInterval }
            : {})}
          onChange={(event) =>
            onChange({ recurrenceInterval: event.target.value })
          }
        />
      ) : null}
      {values.recurrenceFrequency === 'WEEKLY' ? (
        <div>
          <span className="text-body-sm font-medium text-text">
            Dny v týdnu
          </span>
          <div
            className="mt-2 flex flex-wrap gap-2"
            role="group"
            aria-label="Dny opakování"
          >
            {weekdays.map(([day, label]) => (
              <label
                key={day}
                className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md border border-border bg-input px-3 text-body-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={values.recurrenceDaysOfWeek.includes(day)}
                  onChange={(event) =>
                    onChange({
                      recurrenceDaysOfWeek: event.target.checked
                        ? [...values.recurrenceDaysOfWeek, day].sort()
                        : values.recurrenceDaysOfWeek.filter(
                            (item) => item !== day,
                          ),
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
          {errors.recurrenceDaysOfWeek ? (
            <p className="mt-2 text-caption text-danger">
              {errors.recurrenceDaysOfWeek}
            </p>
          ) : null}
        </div>
      ) : null}
      {values.recurrenceFrequency === 'MONTHLY' ? (
        <Input
          label="Den v měsíci"
          type="number"
          min={1}
          max={31}
          value={values.recurrenceDayOfMonth}
          {...(errors.recurrenceDayOfMonth
            ? { error: errors.recurrenceDayOfMonth }
            : {})}
          onChange={(event) =>
            onChange({ recurrenceDayOfMonth: event.target.value })
          }
        />
      ) : null}
      {values.recurrenceFrequency === 'YEARLY' ? (
        <Input
          label="Měsíc v roce"
          type="number"
          min={1}
          max={12}
          value={values.recurrenceMonthOfYear}
          {...(errors.recurrenceMonthOfYear
            ? { error: errors.recurrenceMonthOfYear }
            : {})}
          onChange={(event) =>
            onChange({ recurrenceMonthOfYear: event.target.value })
          }
        />
      ) : null}
      {recurring ? (
        <Input
          label="Konec opakování"
          type="datetime-local"
          value={values.recurrenceEndsAt}
          {...(errors.recurrenceEndsAt
            ? { error: errors.recurrenceEndsAt }
            : {})}
          onChange={(event) =>
            onChange({ recurrenceEndsAt: event.target.value })
          }
        />
      ) : null}
    </fieldset>
  );
}
