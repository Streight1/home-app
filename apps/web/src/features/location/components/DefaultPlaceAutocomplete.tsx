import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import {
  useCalendarPreferences,
  useUpdateCalendarPreferences,
} from '../hooks/useCalendarPreferences.js';
import {
  useCreateSavedPlace,
  useSavedPlaces,
} from '../hooks/useSavedPlaces.js';
import {
  PlaceAutocomplete,
  type EventPlaceValue,
} from './PlaceAutocomplete.js';

const emptyPlace: EventPlaceValue = { placeId: null, label: '', manual: true };

export function DefaultPlaceAutocomplete() {
  const preferences = useCalendarPreferences();
  const places = useSavedPlaces();
  const update = useUpdateCalendarPreferences();
  const create = useCreateSavedPlace();
  const current = places.data?.items.find(
    ({ id }) => id === preferences.data?.defaultPlaceId,
  );
  const [value, setValue] = useState<EventPlaceValue>(emptyPlace);
  useEffect(() => {
    if (current)
      setValue({
        placeId: current.id,
        label: current.label,
        manual: current.provider === 'MANUAL',
      });
  }, [current]);

  const save = async () => {
    let placeId = value.placeId;
    if (!placeId && value.label.trim()) {
      const manual = await create.mutateAsync({
        visibility: 'PRIVATE',
        label: value.label.trim(),
        formattedAddress: value.label.trim(),
        provider: 'MANUAL',
        placeType: 'manual',
      });
      placeId = manual.id;
      setValue({ placeId, label: manual.label, manual: true });
    }
    await update.mutateAsync({ defaultPlaceId: placeId });
  };
  const pending = create.isPending || update.isPending;
  return (
    <div className="grid gap-3 md:col-span-2 xl:col-span-3">
      <PlaceAutocomplete
        label="Výchozí místo"
        value={value}
        onChange={setValue}
      />
      <p className="text-caption text-text-muted">
        Potvrzenou adresu při výpočtu cesty server znovu vyhledá. Výsledky
        Mapy.com se neukládají ani necachují.
      </p>
      {update.isError || create.isError ? (
        <InlineAlert variant="warning">
          Výchozí místo se nepodařilo uložit.
        </InlineAlert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          loading={pending}
          disabled={!value.label.trim() || pending}
          onClick={() => void save()}
        >
          Uložit jako výchozí
        </Button>
        {preferences.data?.defaultPlaceId ? (
          <Button
            disabled={pending}
            onClick={() => {
              setValue(emptyPlace);
              update.mutate({ defaultPlaceId: null });
            }}
          >
            Odebrat výchozí místo
          </Button>
        ) : null}
      </div>
    </div>
  );
}
