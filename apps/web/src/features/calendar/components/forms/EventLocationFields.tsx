import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import {
  PlaceAutocomplete,
  type EventPlaceValue,
} from '../../../location/components/PlaceAutocomplete.js';

export function EventLocationFields({
  place,
  notes,
  onPlaceChange,
  onNotesChange,
}: {
  place: EventPlaceValue;
  notes: string;
  onPlaceChange: (place: EventPlaceValue) => void;
  onNotesChange: (notes: string) => void;
}) {
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-2 text-section-title font-semibold">Místo</legend>
      <PlaceAutocomplete value={place} onChange={onPlaceChange} />
      <Textarea
        label="Pokyny k místu"
        value={notes}
        maxLength={1000}
        onChange={(event) => onNotesChange(event.target.value)}
        hint="Například patro, recepce nebo místo srazu. Citlivé údaje sem nepatří."
      />
    </fieldset>
  );
}
