import { Input } from '../../../../components/ui/Input/Input.js';
import { Switch } from '../../../../components/ui/Switch/Switch.js';
import { MaintenanceMoneyField } from './MaintenanceMoneyField.js';
import type { MaintenancePlanFieldProps } from './MaintenancePlanForm.types.js';

export function MaintenancePlanPracticalFields({
  value,
  update,
}: MaintenancePlanFieldProps) {
  return (
    <>
      <section className="grid gap-4">
        <h3 className="text-body font-semibold">Praktické informace</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Odhad délky v minutách"
            type="number"
            min={5}
            max={1440}
            value={value.estimatedDurationMinutes ?? ''}
            onChange={(event) =>
              update({
                estimatedDurationMinutes: event.target.value
                  ? Number(event.target.value)
                  : null,
              })
            }
          />
          <Input
            label="Upozornit předem (dní)"
            type="number"
            min={0}
            max={365}
            value={value.leadDays}
            onChange={(event) =>
              update({ leadDays: Number(event.target.value) || 0 })
            }
          />
          <Input
            label="Preferovaný čas"
            type="time"
            value={formatPreferredTime(value.preferredStartTime)}
            onChange={(event) =>
              update({
                preferredStartTime: parsePreferredTime(event.target.value),
              })
            }
          />
          <Input
            label="Místo"
            value={value.locationLabel ?? ''}
            onChange={(event) =>
              update({ locationLabel: event.target.value || null })
            }
          />
          <Input
            label="Dodavatel"
            value={value.providerName ?? ''}
            onChange={(event) =>
              update({ providerName: event.target.value || null })
            }
          />
        </div>
        <MaintenanceMoneyField
          label="Výchozí cena"
          amountMinor={value.defaultCostMinor}
          currencyCode={value.defaultCurrencyCode}
          onChange={({ amountMinor, currencyCode }) =>
            update({
              defaultCostMinor: amountMinor,
              defaultCurrencyCode: currencyCode,
            })
          }
        />
      </section>
      <section className="rounded-lg border border-border p-4">
        <div className="flex min-h-11 items-center justify-between gap-4">
          <div>
            <h3 className="text-body-sm font-semibold">
              Automaticky vytvářet úkol
            </h3>
            <p className="text-caption text-text-muted">
              Úkol vznikne přes bezpečné veřejné rozhraní modulu Úkoly.
            </p>
          </div>
          <Switch
            label="Automaticky vytvářet úkol"
            checked={value.autoCreateTask}
            onCheckedChange={(autoCreateTask) => update({ autoCreateTask })}
          />
        </div>
        {value.autoCreateTask ? (
          <div className="mt-4">
            <Input
              label="Vytvořit úkol dní před termínem"
              type="number"
              min={0}
              max={365}
              value={value.taskCreateDaysBefore}
              onChange={(event) =>
                update({
                  taskCreateDaysBefore: Number(event.target.value) || 0,
                })
              }
            />
          </div>
        ) : null}
      </section>
    </>
  );
}

function formatPreferredTime(value: number | null) {
  if (value === null) return '';
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function parsePreferredTime(value: string) {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}
