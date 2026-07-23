import { Input } from '../../../../components/ui/Input/Input.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import { PlaceAutocomplete } from '../../../location/location.public.js';
import type {
  TaskFormErrors,
  TaskFormValues,
} from '../../schemas/taskForm.schema.js';
import { TaskDurationPresets } from './TaskDurationPresets.js';

export function TaskDurationLocationFields({
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
        4. Délka a místo
      </legend>
      <Input
        label="Předpokládaná délka v minutách"
        type="number"
        min={5}
        max={1440}
        step={5}
        value={values.estimatedDurationMinutes}
        {...(errors.estimatedDurationMinutes
          ? { error: errors.estimatedDurationMinutes }
          : {})}
        hint="Například 30, 60 nebo 90 minut."
        onChange={(event) =>
          onChange({ estimatedDurationMinutes: event.target.value })
        }
      />
      <TaskDurationPresets
        value={values.estimatedDurationMinutes}
        onChange={(estimatedDurationMinutes) =>
          onChange({ estimatedDurationMinutes })
        }
      />
      <PlaceAutocomplete
        label="Místo úkolu"
        value={{
          placeId: values.locationPlaceId || null,
          label: values.locationLabel,
          manual: !values.locationPlaceId,
        }}
        onChange={(place) =>
          onChange({
            locationPlaceId: place.placeId ?? '',
            locationLabel: place.label,
          })
        }
      />
      <Textarea
        label="Poznámka k místu"
        value={values.locationNotes}
        {...(errors.locationNotes ? { error: errors.locationNotes } : {})}
        maxLength={1000}
        onChange={(event) => onChange({ locationNotes: event.target.value })}
      />
    </fieldset>
  );
}
