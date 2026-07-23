import { LoaderCircle, Search } from 'lucide-react';
import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { ApiError } from '../../../lib/api/apiError.js';
import { useCreateSavedPlace } from '../hooks/useSavedPlaces.js';
import { usePlaceSuggestions } from '../hooks/usePlaceSuggestions.js';
import type { PlaceSuggestion, SavedPlace } from '../types/location.types.js';
import { PlaceSuggestionList } from './PlaceSuggestionList.js';
import { SelectedPlaceSummary } from './SelectedPlaceSummary.js';

export interface EventPlaceValue {
  placeId: string | null;
  label: string;
  manual: boolean;
}

function providerError(error: Error): string {
  if (!(error instanceof ApiError)) return 'Místa se nyní nepodařilo načíst.';
  if (error.code === 'LOCATION_PROVIDER_NOT_CONFIGURED')
    return 'Mapy.com nejsou na serveru nakonfigurované.';
  if (error.code === 'LOCATION_PROVIDER_FORBIDDEN')
    return 'Mapy.com odmítly oprávnění serveru. Zkontrolujte API klíč.';
  if (error.code === 'REQUEST_TIMEOUT')
    return 'Mapy.com neodpověděly včas. Zkuste hledání zopakovat.';
  return 'Místa se nyní nepodařilo načíst.';
}

export function PlaceAutocomplete({
  value,
  onChange,
  label = 'Místo události',
}: {
  value: EventPlaceValue;
  onChange: (value: EventPlaceValue) => void;
  label?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState(value.label);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = usePlaceSuggestions(query);
  const save = useCreateSavedPlace();
  const items = suggestions.data?.items ?? [];
  useEffect(() => setQuery(value.label), [value.label]);
  const select = (suggestion: PlaceSuggestion) => {
    save.mutate(
      {
        visibility: 'PRIVATE',
        label: suggestion.primaryLabel,
        formattedAddress: suggestion.formattedAddress,
        provider: 'MAPY',
        placeType: suggestion.placeType,
      },
      {
        onSuccess: (place) => {
          setQuery(place.label);
          setOpen(false);
          setActiveIndex(-1);
          onChange({ placeId: place.id, label: place.label, manual: false });
        },
      },
    );
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      const item = items[activeIndex];
      if (item) {
        event.preventDefault();
        select(item);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };
  const selected: SavedPlace | null = value.placeId
    ? {
        id: value.placeId,
        label: value.label,
        formattedAddress: value.label,
        visibility: 'PRIVATE',
        provider: value.manual ? 'MANUAL' : 'MAPY',
        routable: !value.manual,
        placeType: 'selected',
      }
    : null;
  const hasSearch = query.trim().length >= 3;
  return (
    <div className="relative grid gap-2 text-body-sm font-medium text-text">
      <label htmlFor={`${listId}-input`}>{label}</label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-3.5 size-4 text-text-muted"
          aria-hidden="true"
        />
        <input
          id={`${listId}-input`}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-${String(activeIndex)}` : undefined
          }
          value={query}
          onKeyDown={keyDown}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            setActiveIndex(-1);
            onChange({ placeId: null, label: next, manual: true });
          }}
          placeholder="Adresa, firma nebo místo"
          autoComplete="off"
          className="min-h-11 w-full rounded-md border border-border bg-input py-2 pl-9 pr-10 text-text focus-visible:outline-2 focus-visible:outline-focus"
        />
        {suggestions.isFetching || save.isPending ? (
          <LoaderCircle
            className="absolute right-3 top-3.5 size-4 animate-spin text-text-muted"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {open && items.length > 0 ? (
        <PlaceSuggestionList
          id={listId}
          items={items}
          activeIndex={activeIndex}
          onSelect={select}
        />
      ) : null}
      {!query.trim() ? (
        <p className="text-caption text-text-muted">
          Začněte psát adresu nebo název místa.
        </p>
      ) : null}
      {hasSearch && suggestions.isFetching ? (
        <p className="text-caption text-text-muted" role="status">
          Hledáme místa…
        </p>
      ) : null}
      {hasSearch && suggestions.isSuccess && items.length === 0 ? (
        <p className="text-caption text-text-muted">
          Pro tento dotaz jsme nenašli žádné místo.
        </p>
      ) : null}
      {suggestions.isError ? (
        <InlineAlert variant="warning">
          {providerError(suggestions.error)} Text můžete uložit ručně bez
          výpočtu cesty.
        </InlineAlert>
      ) : null}
      {selected ? (
        <SelectedPlaceSummary place={selected} />
      ) : query.trim() ? (
        <p className="text-caption text-text-muted">
          Volný text lze uložit, odhad cesty ale vyžaduje potvrzenou adresu.
        </p>
      ) : null}
    </div>
  );
}
