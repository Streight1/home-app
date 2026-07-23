import { Input } from '../../../components/ui/Input/Input.js';
import { Select } from '../../../components/ui/Select/Select.js';
import { Switch } from '../../../components/ui/Switch/Switch.js';
import type { SchedulingInput } from '../types/scheduling.types.js';

export function SchedulingWindowFields({
  value,
  onChange,
}: {
  value: SchedulingInput;
  onChange: (value: SchedulingInput) => void;
}) {
  const patch = (next: Partial<SchedulingInput>) =>
    onChange({ ...value, ...next });
  return (
    <fieldset className="grid gap-4">
      <legend className="text-section-title font-semibold">
        Hledané období
      </legend>
      <Input
        label="Datum"
        type="date"
        value={value.date}
        onChange={(event) => patch({ date: event.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Nejdříve"
          type="time"
          value={value.earliestTime}
          onChange={(event) => patch({ earliestTime: event.target.value })}
        />
        <Input
          label="Nejpozději do"
          type="time"
          value={value.latestTime}
          onChange={(event) => patch({ latestTime: event.target.value })}
        />
      </div>
      <Select
        label="Způsob cesty"
        disabled={!value.considerTravel}
        value={value.routeMode}
        onChange={(event) =>
          patch({
            routeMode: event.target.value as SchedulingInput['routeMode'],
          })
        }
      >
        <option value="CAR_FAST_TRAFFIC">Autem s dopravou</option>
        <option value="CAR_FAST">Autem</option>
        <option value="CAR_SHORT">Autem – krátká trasa</option>
        <option value="FOOT_FAST">Pěšky</option>
      </Select>
      <Input
        label="Cestovní rezerva v minutách"
        type="number"
        min={0}
        max={180}
        disabled={!value.considerTravel}
        value={value.travelBufferMinutes}
        onChange={(event) =>
          patch({ travelBufferMinutes: Number(event.target.value) })
        }
      />
      <div className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-border bg-surface-subtle p-3">
        <div>
          <p className="font-medium">Zohlednit cestu</p>
          <p className="text-caption text-text-muted">
            Při vypnutí ověříme jen společný volný čas.
          </p>
        </div>
        <Switch
          label="Zohlednit cestu"
          checked={value.considerTravel}
          onCheckedChange={(considerTravel) => patch({ considerTravel })}
        />
      </div>
      <Select
        label="Počet návrhů"
        value={String(value.suggestionCount)}
        onChange={(event) =>
          patch({ suggestionCount: Number(event.target.value) })
        }
      >
        {[1, 3, 5].map((count) => (
          <option key={count} value={count}>
            {count}
          </option>
        ))}
      </Select>
    </fieldset>
  );
}
