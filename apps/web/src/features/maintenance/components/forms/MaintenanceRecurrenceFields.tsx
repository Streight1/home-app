import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type { MaintenanceRecurrence } from '../../types/maintenance.types.js';

const frequencyLabels: Record<MaintenanceRecurrence['frequency'], string> = {
  ONCE: 'Jednorázově',
  DAILY: 'Každých N dní',
  WEEKLY: 'Každých N týdnů',
  MONTHLY: 'Každých N měsíců',
  YEARLY: 'Každý rok',
  CUSTOM_MONTHS: 'Vybrané měsíce',
};

export function MaintenanceRecurrenceFields({
  value,
  onChange,
}: {
  value: MaintenanceRecurrence;
  onChange: (value: MaintenanceRecurrence) => void;
}) {
  const update = (next: Partial<MaintenanceRecurrence>) =>
    onChange({ ...value, ...next });
  const usesInterval = ['DAILY', 'WEEKLY', 'MONTHLY'].includes(value.frequency);
  return (
    <fieldset className="grid gap-4 rounded-lg border border-border p-4">
      <legend className="px-1 text-body-sm font-semibold">Opakování</legend>
      <Select
        label="Frekvence"
        value={value.frequency}
        onChange={(event) =>
          onChange({
            frequency: event.target.value as MaintenanceRecurrence['frequency'],
            interval: 1,
          })
        }
      >
        {Object.entries(frequencyLabels).map(([frequency, label]) => (
          <option key={frequency} value={frequency}>
            {label}
          </option>
        ))}
      </Select>
      {usesInterval ? (
        <Input
          label="Interval"
          type="number"
          min={1}
          max={365}
          value={value.interval}
          onChange={(event) =>
            update({ interval: Number(event.target.value) || 1 })
          }
        />
      ) : null}
      {value.frequency === 'WEEKLY' ? (
        <Select
          label="Den v týdnu"
          value={value.weekdays?.[0] ?? 1}
          onChange={(event) =>
            update({ weekdays: [Number(event.target.value)] })
          }
        >
          {[
            'Pondělí',
            'Úterý',
            'Středa',
            'Čtvrtek',
            'Pátek',
            'Sobota',
            'Neděle',
          ].map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </Select>
      ) : null}
      {value.frequency === 'MONTHLY' ? (
        <Input
          label="Den v měsíci"
          type="number"
          min={1}
          max={31}
          value={value.dayOfMonth ?? 1}
          onChange={(event) =>
            update({ dayOfMonth: Number(event.target.value) || 1 })
          }
        />
      ) : null}
      {value.frequency === 'YEARLY' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Měsíc"
            type="number"
            min={1}
            max={12}
            value={value.monthOfYear ?? 1}
            onChange={(event) =>
              update({ monthOfYear: Number(event.target.value) || 1 })
            }
          />
          <Input
            label="Den"
            type="number"
            min={1}
            max={31}
            value={value.dayOfMonth ?? 1}
            onChange={(event) =>
              update({ dayOfMonth: Number(event.target.value) || 1 })
            }
          />
        </div>
      ) : null}
      {value.frequency === 'CUSTOM_MONTHS' ? (
        <fieldset>
          <legend className="mb-2 text-body-sm font-medium">Měsíce</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 12 }, (_, index) => index + 1).map(
              (month) => (
                <label
                  key={month}
                  className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3"
                >
                  <input
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={value.months?.includes(month) ?? false}
                    onChange={(event) => {
                      const current = value.months ?? [];
                      update({
                        months: event.target.checked
                          ? [...current, month].sort((a, b) => a - b)
                          : current.filter((item) => item !== month),
                      });
                    }}
                  />
                  {month}.
                </label>
              ),
            )}
          </div>
          <div className="mt-4">
            <Input
              label="Den v měsíci"
              type="number"
              min={1}
              max={31}
              value={value.dayOfMonth ?? 1}
              onChange={(event) =>
                update({ dayOfMonth: Number(event.target.value) || 1 })
              }
            />
          </div>
        </fieldset>
      ) : null}
    </fieldset>
  );
}
