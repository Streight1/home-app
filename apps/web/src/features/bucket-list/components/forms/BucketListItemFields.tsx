import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import { PlaceAutocomplete } from '../../../location/location.public.js';
import {
  bucketListCategoryLabels,
  bucketListPriorityLabels,
} from '../../lib/bucketListLabels.js';
import type { BucketListItemFormValues } from './bucketListItemFormValues.js';

export function BucketListItemFields({
  values,
  titleError,
  onChange,
}: {
  values: BucketListItemFormValues;
  titleError?: string;
  onChange: (patch: Partial<BucketListItemFormValues>) => void;
}) {
  return (
    <div className="grid gap-4">
      <Input
        label="Název"
        value={values.title}
        {...(titleError ? { error: titleError } : {})}
        maxLength={200}
        onChange={(event) => onChange({ title: event.target.value })}
      />
      <Textarea
        label="Krátký popis"
        value={values.description}
        maxLength={2000}
        rows={3}
        onChange={(event) => onChange({ description: event.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Kategorie"
          value={values.category}
          onChange={(event) =>
            onChange({
              category: event.target
                .value as BucketListItemFormValues['category'],
            })
          }
        >
          {Object.entries(bucketListCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Priorita"
          value={values.priority}
          onChange={(event) =>
            onChange({
              priority: event.target
                .value as BucketListItemFormValues['priority'],
            })
          }
        >
          {Object.entries(bucketListPriorityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <DatePicker
        label="Cílové datum"
        value={values.targetDate}
        onChange={(targetDate) => onChange({ targetDate })}
      />
      {values.targetDate ? (
        <button
          type="button"
          className="min-h-11 justify-self-start rounded-md px-3 text-body-sm text-text-muted hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
          onClick={() => onChange({ targetDate: '' })}
        >
          Vymazat datum
        </button>
      ) : null}
      <PlaceAutocomplete
        label="Místo"
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
      <Input
        label="Poznámka k místu"
        value={values.locationNotes}
        maxLength={1000}
        onChange={(event) => onChange({ locationNotes: event.target.value })}
      />
      <Textarea
        label="Soukromé poznámky domácnosti"
        value={values.notes}
        maxLength={10000}
        rows={5}
        onChange={(event) => onChange({ notes: event.target.value })}
      />
    </div>
  );
}
