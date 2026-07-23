import { useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import type { EventPlaceValue } from '../../../location/components/PlaceAutocomplete.js';
import type { HouseholdMemberSummary } from '../../../household/household.public.js';
import type {
  CalendarEvent,
  CalendarEventInput,
  CalendarEventType,
  TravelPlan,
  TravelPlanInput,
} from '../../types/calendar.types.js';
import { EventLocationFields } from './EventLocationFields.js';
import { EventTravelFields } from './EventTravelFields.js';
import { EventParticipantSelector } from './EventParticipantSelector.js';
import { WorkShiftPresetPicker } from './WorkShiftPresetPicker.js';
import type { WorkShiftPreset } from './workShiftPresets.js';

function localDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const typeLabels: Record<CalendarEventType, string> = {
  GENERAL: 'Obecná událost',
  WORK_SHIFT: 'Pracovní směna',
  APPOINTMENT: 'Schůzka',
  HOUSEHOLD: 'Domácnost',
  PERSONAL: 'Osobní',
  TRAVEL: 'Cesta',
  OTHER: 'Ostatní',
};

export function CalendarEventForm({
  initial,
  initialDate,
  initialTravelPlan,
  members,
  currentUserId,
  defaultWorkShiftParticipantId,
  loading,
  error,
  onSubmit,
  onCancel,
}: {
  initial?: CalendarEvent;
  initialDate?: string;
  initialTravelPlan?: TravelPlan;
  members: HouseholdMemberSummary[];
  currentUserId: string;
  defaultWorkShiftParticipantId?: string | null | undefined;
  loading: boolean;
  error: string | null;
  onSubmit: (input: CalendarEventInput) => void;
  onCancel: () => void;
}) {
  const defaultStart = useMemo(() => {
    if (initial) return localDateTime(initial.startsAt);
    const date = initialDate ? new Date(`${initialDate}T09:00:00`) : new Date();
    date.setMinutes(0, 0, 0);
    return localDateTime(date);
  }, [initial, initialDate]);
  const defaultEnd = useMemo(() => {
    if (initial) return localDateTime(initial.endsAt);
    return localDateTime(
      new Date(new Date(defaultStart).getTime() + 60 * 60_000),
    );
  }, [defaultStart, initial]);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState<CalendarEventType>(
    initial?.type ?? 'GENERAL',
  );
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(defaultEnd);
  const [isAllDay, setIsAllDay] = useState(initial?.isAllDay ?? false);
  const [place, setPlace] = useState<EventPlaceValue>({
    placeId: initial?.locationPlaceId ?? null,
    label: initial?.locationLabel ?? initial?.location ?? '',
    manual: !initial?.locationPlaceId,
  });
  const [locationNotes, setLocationNotes] = useState(
    initial?.locationNotes ?? '',
  );
  const [travelPlan, setTravelPlan] = useState<TravelPlanInput | null>(
    initialTravelPlan
      ? {
          travelerUserId: initialTravelPlan.travelerUserId,
          originMode: initialTravelPlan.originMode,
          ...(initialTravelPlan.originPlaceId !== undefined
            ? { originPlaceId: initialTravelPlan.originPlaceId }
            : {}),
          ...(initialTravelPlan.previousEventId !== undefined
            ? { previousEventId: initialTravelPlan.previousEventId }
            : {}),
          routeMode: initialTravelPlan.routeMode,
          avoidTolls: initialTravelPlan.avoidTolls,
          avoidHighways: initialTravelPlan.avoidHighways,
          travelBufferMinutes: initialTravelPlan.travelBufferMinutes,
        }
      : null,
  );
  const [calculateTravel, setCalculateTravel] = useState(
    initial?.calculateTravel ?? true,
  );
  const [colorToken, setColorToken] = useState<
    CalendarEventInput['colorToken']
  >(initial?.colorToken ?? 'primary');
  const [participantIds, setParticipantIds] = useState(
    initial?.participants.map(({ user }) => user.id) ?? [currentUserId],
  );
  const [allowShiftConflict, setAllowShiftConflict] = useState(false);
  const toggleParticipant = (userId: string) =>
    setParticipantIds((current) =>
      type === 'WORK_SHIFT'
        ? [userId]
        : current.includes(userId)
          ? current.filter((id) => id !== userId)
          : [...current, userId],
    );
  const preset = (value: WorkShiftPreset) => {
    const start = new Date(startsAt);
    const [startHour, startMinute] = value.start.split(':').map(Number);
    start.setHours(startHour ?? 0, startMinute ?? 0, 0, 0);
    const end = new Date(start);
    const [endHour, endMinute] = value.end.split(':').map(Number);
    end.setHours(endHour ?? 0, endMinute ?? 0, 0, 0);
    if (value.endDayOffset) end.setDate(end.getDate() + value.endDayOffset);
    setStartsAt(localDateTime(start));
    setEndsAt(localDateTime(end));
  };
  const submit = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      type,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Prague',
      isAllDay,
      location: place.label.trim() || null,
      locationPlaceId: place.placeId,
      locationLabel: place.label.trim() || null,
      locationNotes: locationNotes.trim() || null,
      calculateTravel,
      colorToken,
      participantIds,
      ...(allowShiftConflict ? { allowShiftConflict: true } : {}),
      ...(travelPlan ? { travelPlan } : {}),
    });
  };
  return (
    <form className="grid gap-6" onSubmit={submit}>
      {error ? <InlineAlert variant="danger">{error}</InlineAlert> : null}
      <fieldset className="grid gap-4">
        <legend className="mb-3 text-section-title font-semibold">
          Základní údaje
        </legend>
        <Input
          label="Název"
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
      </fieldset>
      <EventLocationFields
        place={place}
        notes={locationNotes}
        onPlaceChange={setPlace}
        onNotesChange={setLocationNotes}
      />
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-section-title font-semibold sm:col-span-2">
          Datum a čas
        </legend>
        <Input
          label="Začátek"
          type="datetime-local"
          required
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
        />
        <Input
          label="Konec"
          type="datetime-local"
          required
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
        />
        <label className="flex min-h-11 items-center gap-3 text-body-sm font-medium">
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={(event) => setIsAllDay(event.target.checked)}
            className="size-5 accent-primary"
          />
          Celý den
        </label>
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-section-title font-semibold sm:col-span-2">
          Typ a barva
        </legend>
        <Select
          label="Typ"
          value={type}
          onChange={(event) => {
            const next = event.target.value as CalendarEventType;
            setType(next);
            if (next === 'WORK_SHIFT') {
              const preferred =
                defaultWorkShiftParticipantId &&
                members.some(({ id }) => id === defaultWorkShiftParticipantId)
                  ? defaultWorkShiftParticipantId
                  : currentUserId;
              setParticipantIds([preferred]);
            }
          }}
        >
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Barva"
          value={colorToken}
          onChange={(event) =>
            setColorToken(
              event.target.value as CalendarEventInput['colorToken'],
            )
          }
        >
          <option value="primary">Fialová</option>
          <option value="blue">Modrá</option>
          <option value="cyan">Tyrkysová</option>
          <option value="success">Zelená</option>
          <option value="warning">Oranžová</option>
          <option value="danger">Červená</option>
        </Select>
        {type === 'WORK_SHIFT' ? (
          <WorkShiftPresetPicker onSelect={preset} />
        ) : null}
      </fieldset>
      <EventParticipantSelector
        type={type}
        members={members}
        selected={participantIds}
        onToggle={toggleParticipant}
      />
      <EventTravelFields
        {...(initial ? { eventId: initial.id } : {})}
        members={members.filter((member) => participantIds.includes(member.id))}
        startsAt={startsAt}
        destinationPlaceId={place.placeId}
        calculateTravel={calculateTravel}
        value={travelPlan}
        onCalculateTravelChange={setCalculateTravel}
        onChange={setTravelPlan}
      />
      {type === 'WORK_SHIFT' ? (
        <label className="flex min-h-11 items-center gap-3 text-body-sm">
          <input
            type="checkbox"
            checked={allowShiftConflict}
            onChange={(event) => setAllowShiftConflict(event.target.checked)}
            className="size-5 accent-primary"
          />
          Potvrzuji případný překryv s jinou směnou
        </label>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancel}>Zrušit</Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={!title.trim() || participantIds.length === 0}
        >
          Uložit událost
        </Button>
      </div>
    </form>
  );
}
