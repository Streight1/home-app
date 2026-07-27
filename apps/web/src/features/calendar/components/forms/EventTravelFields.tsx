import { useEffect, useMemo } from 'react';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type { HouseholdMemberSummary } from '../../../household/household.public.js';
import {
  PlaceAutocomplete,
  type EventPlaceValue,
} from '../../../location/components/PlaceAutocomplete.js';
import { useCalendarPreferences } from '../../../location/hooks/useCalendarPreferences.js';
import { useSavedPlaces } from '../../../location/hooks/useSavedPlaces.js';
import {
  usePreviousEventCandidates,
  useTravelEstimatePreview,
} from '../../hooks/useCalendar.js';
import type { TravelPlanInput } from '../../types/calendar.types.js';
import { TravelEstimatePreviewList } from '../travel/TravelEstimatePreviewList.js';

export function EventTravelFields({
  eventId,
  members,
  startsAt,
  isAllDay = false,
  allDayStartDate = startsAt.slice(0, 10),
  desiredArrivalAt = '',
  onDesiredArrivalAtChange = () => undefined,
  destinationPlaceId,
  calculateTravel,
  value,
  onCalculateTravelChange,
  onChange,
}: {
  eventId?: string;
  members: HouseholdMemberSummary[];
  startsAt: string;
  isAllDay?: boolean | undefined;
  allDayStartDate?: string | undefined;
  desiredArrivalAt?: string | undefined;
  onDesiredArrivalAtChange?: ((value: string) => void) | undefined;
  destinationPlaceId: string | null;
  calculateTravel: boolean;
  value: TravelPlanInput | null;
  onCalculateTravelChange: (value: boolean) => void;
  onChange: (value: TravelPlanInput | null) => void;
}) {
  const preferences = useCalendarPreferences();
  const places = useSavedPlaces();
  const traveler = value?.travelerUserId ?? members[0]?.id ?? '';
  const previous = usePreviousEventCandidates(
    eventId ?? null,
    traveler || null,
  );
  const selectedOrigin = places.data?.items.find(
    ({ id }) => id === value?.originPlaceId,
  );
  const customOrigin: EventPlaceValue = {
    placeId: value?.originPlaceId ?? null,
    label: selectedOrigin?.label ?? '',
    manual: !value?.originPlaceId,
  };
  const destinationReady = Boolean(destinationPlaceId) && members.length > 0;
  const defaults = useMemo<TravelPlanInput | null>(
    () =>
      traveler
        ? {
            travelerUserId: traveler,
            originMode: 'AUTO',
            routeMode: preferences.data?.defaultRouteMode ?? 'CAR_FAST_TRAFFIC',
            avoidTolls: preferences.data?.avoidTolls ?? false,
            avoidHighways: preferences.data?.avoidHighways ?? false,
            travelBufferMinutes:
              preferences.data?.defaultTravelBufferMinutes ?? 10,
          }
        : null,
    [preferences.data, traveler],
  );
  useEffect(() => {
    if (calculateTravel && destinationReady && !value && defaults)
      onChange(defaults);
  }, [calculateTravel, defaults, destinationReady, onChange, value]);
  useEffect(() => {
    const first = members[0]?.id;
    if (
      value &&
      first &&
      !members.some(({ id }) => id === value.travelerUserId)
    )
      onChange({ ...value, travelerUserId: first });
  }, [members, onChange, value]);
  const travelTarget = isAllDay ? desiredArrivalAt : startsAt;
  const validStart = Number.isFinite(new Date(travelTarget).getTime());
  const previewInput =
    calculateTravel && value && destinationPlaceId && validStart
      ? {
          ...(eventId ? { eventId } : {}),
          ...(isAllDay
            ? { desiredArrivalAt: new Date(travelTarget).toISOString() }
            : { startsAt: new Date(travelTarget).toISOString() }),
          participantIds: members.map(({ id }) => id),
          destinationPlaceId,
          originMode: value.originMode,
          ...(value.originPlaceId
            ? { originPlaceId: value.originPlaceId }
            : {}),
          ...(value.previousEventId
            ? { previousEventId: value.previousEventId }
            : {}),
          routeMode: value.routeMode,
          avoidTolls: value.avoidTolls,
          avoidHighways: value.avoidHighways,
          travelBufferMinutes: value.travelBufferMinutes,
        }
      : null;
  const preview = useTravelEstimatePreview(previewInput);
  const patch = (next: Partial<TravelPlanInput>) =>
    value && onChange({ ...value, ...next });
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-2 text-section-title font-semibold">
        Odhad cesty
      </legend>
      <label className="flex min-h-11 items-start gap-3 text-body-sm font-medium">
        <input
          type="checkbox"
          className="mt-1 size-5 accent-primary"
          checked={calculateTravel}
          disabled={!destinationReady}
          onChange={(event) => {
            onCalculateTravelChange(event.target.checked);
            if (!event.target.checked) onChange(null);
          }}
        />
        <span>
          Vypočítat odhad cesty
          <span className="mt-1 block text-caption font-normal text-text-muted">
            Počátek se vyhodnotí pro každého účastníka zvlášť.
          </span>
        </span>
      </label>
      {!destinationPlaceId ? (
        <p className="text-caption text-text-muted">
          Pro výpočet vyberte potvrzené cílové místo.
        </p>
      ) : null}
      {calculateTravel && value ? (
        <div className="grid gap-4 rounded-lg border border-border bg-surface-subtle p-4 sm:grid-cols-2">
          {isAllDay ? (
            <>
              <DatePicker
                label="Datum požadovaného příjezdu"
                value={desiredArrivalAt.slice(0, 10) || allDayStartDate}
                onChange={(date) => {
                  const time = desiredArrivalAt.slice(11, 16);
                  onDesiredArrivalAtChange(time ? `${date}T${time}` : '');
                }}
              />
              <Input
                label="Kdy chcete na místo dorazit?"
                type="time"
                value={desiredArrivalAt.slice(11, 16)}
                onChange={(event) =>
                  onDesiredArrivalAtChange(
                    event.target.value
                      ? `${desiredArrivalAt.slice(0, 10) || allDayStartDate}T${event.target.value}`
                      : '',
                  )
                }
                hint="Bez času příjezdu se cesta nevypočítá."
              />
            </>
          ) : null}
          <Select
            label="Počátek cesty"
            value={value.originMode}
            onChange={(event) =>
              patch({
                originMode: event.target.value as TravelPlanInput['originMode'],
                originPlaceId: null,
                previousEventId: null,
              })
            }
          >
            <option value="AUTO">Automaticky</option>
            <option value="DEFAULT_PLACE">Výchozí místo účastníka</option>
            <option value="CUSTOM_PLACE">Jiné uložené místo</option>
            {eventId && members.length === 1 ? (
              <option value="PREVIOUS_EVENT">
                Konkrétní předchozí událost
              </option>
            ) : null}
          </Select>
          {value.originMode === 'CUSTOM_PLACE' ? (
            <PlaceAutocomplete
              label="Jiné místo odjezdu"
              value={customOrigin}
              onChange={(place) =>
                patch({ originPlaceId: place.placeId ?? null })
              }
            />
          ) : null}
          {value.originMode === 'PREVIOUS_EVENT' ? (
            <Select
              label="Předchozí událost"
              value={value.previousEventId ?? ''}
              onChange={(event) =>
                patch({ previousEventId: event.target.value || null })
              }
            >
              <option value="">Vyberte explicitně</option>
              {previous.data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} · {item.locationLabel}
                </option>
              ))}
            </Select>
          ) : null}
          <Select
            label="Způsob dopravy"
            value={value.routeMode}
            onChange={(event) =>
              patch({
                routeMode: event.target.value as TravelPlanInput['routeMode'],
              })
            }
          >
            <option value="CAR_FAST_TRAFFIC">Autem s provozem</option>
            <option value="CAR_FAST">Autem nejrychleji</option>
            <option value="CAR_SHORT">Autem nejkratší</option>
            <option value="FOOT_FAST">Pěšky</option>
            <option value="BICYCLE_ROAD">Silniční kolo</option>
            <option value="BICYCLE_MOUNTAIN">Horské kolo</option>
          </Select>
          <Input
            label="Rezerva v minutách"
            type="number"
            min={0}
            max={240}
            value={value.travelBufferMinutes}
            onChange={(event) =>
              patch({ travelBufferMinutes: Number(event.target.value) })
            }
          />
          <label className="flex min-h-11 items-center gap-3 text-body-sm">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={value.avoidTolls}
              onChange={(event) => patch({ avoidTolls: event.target.checked })}
            />
            Vyhnout se placeným úsekům
          </label>
          <label className="flex min-h-11 items-center gap-3 text-body-sm">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={value.avoidHighways}
              onChange={(event) =>
                patch({ avoidHighways: event.target.checked })
              }
            />
            Vyhnout se dálnicím
          </label>
        </div>
      ) : null}
      {calculateTravel && isAllDay && !desiredArrivalAt ? (
        <p className="text-caption text-text-muted">
          Pro výpočet cesty zadejte, kdy chcete dorazit.
        </p>
      ) : null}
      {preview.isError ? (
        <p className="text-body-sm text-warning">
          Odhad cesty se nepodařilo vypočítat.
        </p>
      ) : null}
      <TravelEstimatePreviewList
        preview={preview.data}
        members={members}
        loading={preview.isFetching}
      />
    </fieldset>
  );
}
