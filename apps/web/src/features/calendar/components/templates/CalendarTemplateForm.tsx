import { useState, type SyntheticEvent } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import type { HouseholdMemberSummary } from '../../../household/household.public.js';
import {
  PlaceAutocomplete,
  type EventPlaceValue,
} from '../../../location/components/PlaceAutocomplete.js';
import type {
  CalendarEventType,
  CalendarTemplateInput,
} from '../../types/calendar.types.js';
import { WorkShiftPresetPicker } from '../forms/WorkShiftPresetPicker.js';
import type { WorkShiftPreset } from '../forms/workShiftPresets.js';

export function CalendarTemplateForm({
  members,
  loading,
  onSubmit,
  onCancel,
  initialValue,
}: {
  members: HouseholdMemberSummary[];
  loading: boolean;
  onSubmit: (input: CalendarTemplateInput) => void;
  onCancel: () => void;
  initialValue?: CalendarTemplateInput;
}) {
  const [name, setName] = useState(initialValue?.name ?? '');
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [description, setDescription] = useState(
    initialValue?.description ?? '',
  );
  const [eventType, setEventType] = useState<CalendarEventType>(
    initialValue?.eventType ?? 'WORK_SHIFT',
  );
  const [startLocalTime, setStartLocalTime] = useState(
    initialValue?.startLocalTime ?? '08:00',
  );
  const [endLocalTime, setEndLocalTime] = useState(
    initialValue?.endLocalTime ?? '20:00',
  );
  const [endDayOffset, setEndDayOffset] = useState(
    initialValue?.endDayOffset ?? 0,
  );
  const [place, setPlace] = useState<EventPlaceValue>({
    placeId: initialValue?.locationPlaceId ?? null,
    label: initialValue?.locationLabel ?? initialValue?.defaultLocation ?? '',
    manual: !initialValue?.locationPlaceId,
  });
  const [calculateTravel, setCalculateTravel] = useState(
    initialValue?.calculateTravel ?? true,
  );
  const [routeMode, setRouteMode] = useState<
    NonNullable<CalendarTemplateInput['routeMode']>
  >(initialValue?.routeMode ?? 'CAR_FAST_TRAFFIC');
  const [travelBufferMinutes, setTravelBufferMinutes] = useState(
    initialValue?.travelBufferMinutes ?? 10,
  );
  const [participantIds, setParticipantIds] = useState<string[]>(
    initialValue?.participantIds ?? [],
  );
  const submit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    onSubmit({
      name: name.trim(),
      title: title.trim(),
      description: description.trim() || null,
      eventType,
      startLocalTime,
      endLocalTime,
      endDayOffset,
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Prague',
      isAllDay: false,
      defaultLocation: place.label.trim() || null,
      locationPlaceId: place.placeId,
      locationLabel: place.label.trim() || null,
      calculateTravel,
      routeMode,
      travelBufferMinutes,
      colorToken: eventType === 'WORK_SHIFT' ? 'blue' : 'primary',
      participantIds,
    });
  };
  const selectMember = (id: string) =>
    setParticipantIds((current) =>
      eventType === 'WORK_SHIFT'
        ? [id]
        : current.includes(id)
          ? current.filter((value) => value !== id)
          : [...current, id],
    );
  const applyPreset = (preset: WorkShiftPreset) => {
    setEventType('WORK_SHIFT');
    setStartLocalTime(preset.start);
    setEndLocalTime(preset.end);
    setEndDayOffset(preset.endDayOffset);
  };
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <Input
        label="Název šablony"
        required
        maxLength={100}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Input
        label="Název události"
        required
        maxLength={200}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <Textarea
        label="Poznámka"
        maxLength={10_000}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Select
        label="Typ"
        value={eventType}
        onChange={(event) => {
          const value = event.target.value as CalendarEventType;
          setEventType(value);
          if (value === 'WORK_SHIFT')
            setParticipantIds((ids) => ids.slice(0, 1));
        }}
      >
        <option value="WORK_SHIFT">Pracovní směna</option>
        <option value="GENERAL">Obecná</option>
        <option value="APPOINTMENT">Schůzka</option>
        <option value="HOUSEHOLD">Domácnost</option>
        <option value="PERSONAL">Osobní</option>
        <option value="TRAVEL">Cesta</option>
        <option value="OTHER">Ostatní</option>
      </Select>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Začátek"
          type="time"
          required
          value={startLocalTime}
          onChange={(event) => setStartLocalTime(event.target.value)}
        />
        <Input
          label="Konec"
          type="time"
          required
          value={endLocalTime}
          onChange={(event) => setEndLocalTime(event.target.value)}
        />
        <Select
          label="Konec"
          value={endDayOffset}
          onChange={(event) => setEndDayOffset(Number(event.target.value))}
        >
          <option value={0}>Stejný den</option>
          <option value={1}>Další den</option>
        </Select>
      </div>
      {eventType === 'WORK_SHIFT' ? (
        <WorkShiftPresetPicker onSelect={applyPreset} />
      ) : null}
      <PlaceAutocomplete
        label="Cílové místo události"
        value={place}
        onChange={setPlace}
      />
      <label className="flex min-h-11 items-start gap-3 text-body-sm">
        <input
          type="checkbox"
          className="mt-1 size-5 accent-primary"
          checked={calculateTravel}
          disabled={!place.placeId}
          onChange={(event) => setCalculateTravel(event.target.checked)}
        />
        <span>
          Vypočítat odhad cesty při použití šablony
          <span className="mt-1 block text-caption text-text-muted">
            Počátek se do šablony neukládá; vyhodnotí se až pro konkrétní
            událost.
          </span>
        </span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Výchozí způsob dopravy"
          value={routeMode}
          onChange={(event) =>
            setRouteMode(
              event.target.value as NonNullable<
                CalendarTemplateInput['routeMode']
              >,
            )
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
          label="Cestovní rezerva v minutách"
          type="number"
          min={0}
          max={240}
          value={travelBufferMinutes}
          onChange={(event) =>
            setTravelBufferMinutes(Number(event.target.value))
          }
        />
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-2 font-semibold">Výchozí účastníci</legend>
        {members.map((member) => (
          <label
            key={member.id}
            className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3"
          >
            <input
              type={eventType === 'WORK_SHIFT' ? 'radio' : 'checkbox'}
              name={eventType === 'WORK_SHIFT' ? 'template-member' : undefined}
              checked={participantIds.includes(member.id)}
              onChange={() => selectMember(member.id)}
              className="size-5 accent-primary"
            />
            {member.displayName ?? member.email}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancel}>Zrušit</Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={!name.trim() || !title.trim() || !participantIds.length}
        >
          Uložit šablonu
        </Button>
      </div>
    </form>
  );
}
