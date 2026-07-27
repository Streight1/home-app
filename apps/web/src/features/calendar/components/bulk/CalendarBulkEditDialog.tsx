import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type { HouseholdMemberSummary } from '../../../household/household.public.js';
import {
  PlaceAutocomplete,
  type EventPlaceValue,
} from '../../../location/components/PlaceAutocomplete.js';
import { useCalendarMutations } from '../../hooks/useCalendar.js';
import type {
  CalendarBulkUpdateInput,
  CalendarColorToken,
  CalendarEventType,
} from '../../types/calendar.types.js';
import { CalendarEventColorPicker } from '../forms/CalendarEventColorPicker.js';

export function CalendarBulkEditDialog({
  open,
  eventIds,
  members,
  onOpenChange,
  onUpdated,
}: {
  open: boolean;
  eventIds: string[];
  members: HouseholdMemberSummary[];
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const { updateBulk } = useCalendarMutations();
  const [colorOperation, setColorOperation] =
    useState<NonNullable<CalendarBulkUpdateInput['colorOperation']>>(
      'UNCHANGED',
    );
  const [colorToken, setColorToken] = useState<CalendarColorToken | null>(
    'violet',
  );
  const [typeOperation, setTypeOperation] =
    useState<NonNullable<CalendarBulkUpdateInput['typeOperation']>>(
      'UNCHANGED',
    );
  const [eventType, setEventType] = useState<CalendarEventType>('GENERAL');
  const [participantOperation, setParticipantOperation] =
    useState<NonNullable<CalendarBulkUpdateInput['participantOperation']>>(
      'UNCHANGED',
    );
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [locationOperation, setLocationOperation] =
    useState<NonNullable<CalendarBulkUpdateInput['locationOperation']>>(
      'UNCHANGED',
    );
  const [place, setPlace] = useState<EventPlaceValue>({
    placeId: null,
    label: '',
    manual: true,
  });
  const [calculateTravel, setCalculateTravel] = useState('UNCHANGED');
  const [routeMode, setRouteMode] = useState('UNCHANGED');
  const [buffer, setBuffer] = useState('');
  const submit = () => {
    const input: CalendarBulkUpdateInput = { eventIds };
    if (colorOperation !== 'UNCHANGED') {
      input.colorOperation = colorOperation;
      if (colorOperation === 'SET' && colorToken) input.colorToken = colorToken;
    }
    if (typeOperation === 'SET') {
      input.typeOperation = 'SET';
      input.eventType = eventType;
    }
    if (participantOperation !== 'UNCHANGED') {
      input.participantOperation = participantOperation;
      input.participantIds = participantIds;
    }
    if (locationOperation !== 'UNCHANGED') {
      input.locationOperation = locationOperation;
      if (locationOperation === 'SET' && place.placeId) {
        input.locationPlaceId = place.placeId;
        input.locationLabel = place.label;
      }
    }
    if (calculateTravel !== 'UNCHANGED') {
      input.calculateTravelOperation = 'SET';
      input.calculateTravel = calculateTravel === 'ON';
    }
    if (routeMode !== 'UNCHANGED') {
      input.routeModeOperation = 'SET';
      input.routeMode = routeMode as NonNullable<
        CalendarBulkUpdateInput['routeMode']
      >;
    }
    if (buffer) {
      input.travelBufferOperation = 'SET';
      input.travelBufferMinutes = Number(buffer);
    }
    updateBulk.mutate(input, {
      onSuccess: () => {
        onOpenChange(false);
        onUpdated();
      },
    });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !updateBulk.isPending && onOpenChange(next)}
      title={`Upravit ${String(eventIds.length)} vybraných událostí`}
      description="Každé pole se změní jen tehdy, když výslovně zvolíte Nastavit, Odebrat nebo konkrétní operaci."
      size="lg"
      mobileFullScreen
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Barva"
          value={colorOperation}
          onChange={(event) =>
            setColorOperation(
              event.target.value as NonNullable<
                CalendarBulkUpdateInput['colorOperation']
              >,
            )
          }
        >
          <option value="UNCHANGED">Neměnit</option>
          <option value="SET">Nastavit</option>
          <option value="REMOVE">Automaticky podle účastníka</option>
        </Select>
        <Select
          label="Typ události"
          value={typeOperation === 'SET' ? eventType : 'UNCHANGED'}
          onChange={(event) => {
            if (event.target.value === 'UNCHANGED')
              setTypeOperation('UNCHANGED');
            else {
              setTypeOperation('SET');
              setEventType(event.target.value as CalendarEventType);
            }
          }}
        >
          <option value="UNCHANGED">Neměnit</option>
          <option value="GENERAL">Obecná událost</option>
          <option value="APPOINTMENT">Schůzka</option>
          <option value="HOUSEHOLD">Domácnost</option>
          <option value="PERSONAL">Osobní</option>
          <option value="WORK_SHIFT">Pracovní směna</option>
          <option value="TRAVEL">Cesta</option>
          <option value="OTHER">Ostatní</option>
        </Select>
        {colorOperation === 'SET' ? (
          <CalendarEventColorPicker
            value={colorToken}
            onChange={(next) => {
              if (next) setColorToken(next);
              else setColorOperation('REMOVE');
            }}
          />
        ) : null}
        <Select
          label="Účastníci"
          value={participantOperation}
          onChange={(event) =>
            setParticipantOperation(
              event.target.value as NonNullable<
                CalendarBulkUpdateInput['participantOperation']
              >,
            )
          }
        >
          <option value="UNCHANGED">Neměnit</option>
          <option value="ADD">Přidat</option>
          <option value="REMOVE">Odebrat</option>
          <option value="REPLACE">Nahradit</option>
        </Select>
        {participantOperation !== 'UNCHANGED' ? (
          <fieldset className="grid gap-2 rounded-md border border-border p-3">
            <legend className="px-1 text-body-sm font-medium">Členové</legend>
            {members.map((member) => (
              <label
                key={member.id}
                className="flex min-h-11 items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={participantIds.includes(member.id)}
                  onChange={() =>
                    setParticipantIds((current) =>
                      current.includes(member.id)
                        ? current.filter((id) => id !== member.id)
                        : [...current, member.id],
                    )
                  }
                />
                {member.displayName ?? member.email}
              </label>
            ))}
          </fieldset>
        ) : null}
        <Select
          label="Cílové místo"
          value={locationOperation}
          onChange={(event) =>
            setLocationOperation(
              event.target.value as NonNullable<
                CalendarBulkUpdateInput['locationOperation']
              >,
            )
          }
        >
          <option value="UNCHANGED">Neměnit</option>
          <option value="SET">Nastavit</option>
          <option value="REMOVE">Odebrat</option>
        </Select>
        {locationOperation === 'SET' ? (
          <PlaceAutocomplete value={place} onChange={setPlace} />
        ) : null}
        <Select
          label="Odhad cesty"
          value={calculateTravel}
          onChange={(event) => setCalculateTravel(event.target.value)}
        >
          <option value="UNCHANGED">Neměnit</option>
          <option value="ON">Zapnout</option>
          <option value="OFF">Vypnout</option>
        </Select>
        <Select
          label="Způsob dopravy"
          value={routeMode}
          onChange={(event) => setRouteMode(event.target.value)}
        >
          <option value="UNCHANGED">Neměnit</option>
          <option value="CAR_FAST_TRAFFIC">Autem s provozem</option>
          <option value="CAR_FAST">Autem nejrychleji</option>
          <option value="CAR_SHORT">Autem nejkratší</option>
          <option value="FOOT_FAST">Pěšky</option>
          <option value="BICYCLE_ROAD">Silniční kolo</option>
        </Select>
        <Input
          label="Nová cestovní rezerva"
          type="number"
          min={0}
          max={240}
          value={buffer}
          onChange={(event) => setBuffer(event.target.value)}
          hint="Prázdné pole zůstane beze změny."
        />
      </div>
      {updateBulk.isError ? (
        <InlineAlert variant="danger">
          Hromadná změna se nepodařila. Události zůstaly beze změny.
        </InlineAlert>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          disabled={updateBulk.isPending}
          onClick={() => onOpenChange(false)}
        >
          Zpět
        </Button>
        <Button
          variant="primary"
          loading={updateBulk.isPending}
          disabled={locationOperation === 'SET' && !place.placeId}
          onClick={submit}
        >
          Použít změny
        </Button>
      </div>
    </Dialog>
  );
}
