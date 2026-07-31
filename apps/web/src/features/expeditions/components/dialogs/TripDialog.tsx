import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import {
  useHouseholdMembers,
  type HouseholdMemberSummary,
} from '../../../household/household.public.js';
import {
  useExpeditionMutations,
  usePackTemplates,
} from '../../hooks/useExpeditions.js';
import { todayDate, TRIP_TYPE_LABELS } from '../../lib/expeditionLabels.js';
import type { TripInput, TripType } from '../../types/expeditions.types.js';

const initial = (): TripInput => ({
  title: '',
  description: '',
  tripType: 'DAY_HIKE',
  startsOn: todayDate(),
  endsOn: todayDate(),
  locationLabel: '',
  overnightCount: 0,
  targetBaseWeightGrams: null,
  notes: '',
  templateId: null,
  participants: [],
});

function participantDefaults(members: HouseholdMemberSummary[]) {
  const first = members[0];
  return first ? [{ userId: first.id, role: 'ORGANIZER' as const }] : [];
}

export function TripDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState(initial);
  const members = useHouseholdMembers();
  const templates = usePackTemplates();
  const mutations = useExpeditionMutations();
  useEffect(() => {
    if (open && value.participants.length === 0 && members.data?.length)
      setValue((current) => ({
        ...current,
        participants: participantDefaults(members.data),
      }));
  }, [members.data, open, value.participants.length]);
  const close = () => {
    setValue(initial());
    mutations.createTrip.reset();
    onOpenChange(false);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && close()}
      title="Nová výprava"
      description="Vytvořte konkrétní výpravu; šablona se zkopíruje jako neměnný snapshot."
      size="lg"
      mobileFullScreen
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          mutations.createTrip.mutate(value, { onSuccess: close });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Název výpravy"
            required
            value={value.title}
            onChange={(event) =>
              setValue((current) => ({ ...current, title: event.target.value }))
            }
          />
          <Select
            label="Typ výpravy"
            value={value.tripType}
            onChange={(event) => {
              const tripType = event.target.value as TripType;
              setValue((current) => ({
                ...current,
                tripType,
                overnightCount:
                  tripType === 'DAY_HIKE'
                    ? 0
                    : Math.max(1, current.overnightCount),
              }));
            }}
          >
            {Object.entries(TRIP_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Začátek"
            type="date"
            required
            value={value.startsOn}
            onChange={(event) => {
              const startsOn = event.target.value;
              setValue((current) => ({
                ...current,
                startsOn,
                endsOn: current.endsOn < startsOn ? startsOn : current.endsOn,
              }));
            }}
          />
          <Input
            label="Konec"
            type="date"
            min={value.startsOn}
            required
            value={value.endsOn}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                endsOn: event.target.value,
              }))
            }
          />
          <Input
            label="Místo"
            value={value.locationLabel}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                locationLabel: event.target.value,
              }))
            }
          />
          <Input
            label="Počet nocí"
            type="number"
            min={0}
            max={365}
            disabled={value.tripType === 'DAY_HIKE'}
            value={value.overnightCount}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                overnightCount: Number(event.target.value),
              }))
            }
          />
          <Input
            label="Cílová základní hmotnost (g)"
            type="number"
            min={0}
            value={value.targetBaseWeightGrams ?? ''}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                targetBaseWeightGrams: event.target.value
                  ? Number(event.target.value)
                  : null,
              }))
            }
          />
          <Select
            label="Gearlist šablona"
            value={value.templateId ?? ''}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                templateId: event.target.value || null,
              }))
            }
          >
            <option value="">Začít bez šablony</option>
            {(templates.data ?? []).map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
        </div>
        <Textarea
          label="Popis"
          value={value.description}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
        <fieldset className="grid gap-2 rounded-lg border border-border p-4">
          <legend className="px-2 text-body-sm font-semibold">Účastníci</legend>
          {(members.data ?? []).map((member) => {
            const selected = value.participants.some(
              ({ userId }) => userId === member.id,
            );
            return (
              <label
                key={member.id}
                className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-surface-hover"
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) =>
                    setValue((current) => {
                      if (event.target.checked)
                        return {
                          ...current,
                          participants: [
                            ...current.participants,
                            {
                              userId: member.id,
                              role:
                                current.participants.length === 0
                                  ? 'ORGANIZER'
                                  : 'PARTICIPANT',
                            },
                          ],
                        };
                      const next = current.participants.filter(
                        ({ userId }) => userId !== member.id,
                      );
                      const first = next[0];
                      if (
                        first &&
                        !next.some(({ role }) => role === 'ORGANIZER')
                      )
                        next[0] = { ...first, role: 'ORGANIZER' };
                      return { ...current, participants: next };
                    })
                  }
                />
                <span>{member.displayName ?? member.email}</span>
                {value.participants.find(({ userId }) => userId === member.id)
                  ?.role === 'ORGANIZER' ? (
                  <span className="ml-auto text-caption text-text-muted">
                    Organizátor
                  </span>
                ) : null}
              </label>
            );
          })}
        </fieldset>
        <InlineAlert>
          Stav Připraveno vychází jen z vašeho seznamu a nenahrazuje posouzení
          počasí, trasy ani bezpečnosti.
        </InlineAlert>
        {mutations.createTrip.error ? (
          <InlineAlert variant="danger">
            {mutations.createTrip.error.message}
          </InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" onClick={close}>
            Zrušit
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={mutations.createTrip.isPending}
            disabled={
              !value.title.trim() ||
              value.participants.length === 0 ||
              mutations.createTrip.isPending
            }
          >
            Vytvořit výpravu
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
