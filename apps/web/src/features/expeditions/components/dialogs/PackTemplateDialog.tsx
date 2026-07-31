import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import { useExpeditionMutations, useGear } from '../../hooks/useExpeditions.js';
import { TRIP_TYPE_LABELS } from '../../lib/expeditionLabels.js';
import type { TripType } from '../../types/expeditions.types.js';

export function PackTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tripType, setTripType] = useState<TripType>('DAY_HIKE');
  const [seasonLabel, setSeasonLabel] = useState('');
  const [target, setTarget] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const gear = useGear({ page: 1, pageSize: 100 });
  const mutations = useExpeditionMutations();
  const close = () => {
    setName('');
    setDescription('');
    setTripType('DAY_HIKE');
    setSeasonLabel('');
    setTarget('');
    setSelected([]);
    mutations.createTemplate.reset();
    onOpenChange(false);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && close()}
      title="Nový gearlist"
      description="Šablona zachová názvy a hmotnosti jako snapshot."
      size="lg"
      mobileFullScreen
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const byId = new Map(
            (gear.data?.items ?? []).map((item) => [item.id, item]),
          );
          mutations.createTemplate.mutate(
            {
              name,
              description,
              tripType,
              seasonLabel,
              targetBaseWeightGrams: target ? Number(target) : null,
              defaultParticipantCount: 1,
              items: selected.flatMap((gearItemId) => {
                const item = byId.get(gearItemId);
                return item
                  ? [
                      {
                        gearItemId,
                        quantity: item.defaultQuantity,
                        unitWeightGrams: item.weightGrams,
                        loadType: item.defaultLoadType,
                        criticality: item.defaultCriticality,
                        isShared: item.isHouseholdShared,
                      },
                    ]
                  : [];
              }),
            },
            { onSuccess: close },
          );
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Název gearlistu"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Select
            label="Typ výpravy"
            value={tripType}
            onChange={(event) => setTripType(event.target.value as TripType)}
          >
            {Object.entries(TRIP_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Sezóna"
            value={seasonLabel}
            onChange={(event) => setSeasonLabel(event.target.value)}
            placeholder="např. léto"
          />
          <Input
            label="Cílová základní hmotnost (g)"
            type="number"
            min={0}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          />
        </div>
        <Textarea
          label="Popis"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <fieldset className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-border p-4">
          <legend className="px-2 text-body-sm font-semibold">
            Položky z katalogu výbavy
          </legend>
          {(gear.data?.items ?? []).map((item) => (
            <label
              key={item.id}
              className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-surface-hover"
            >
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, item.id]
                      : current.filter((id) => id !== item.id),
                  )
                }
              />
              <span>{item.name}</span>
              <span className="ml-auto text-caption text-text-muted">
                {item.weightGrams} g
              </span>
            </label>
          ))}
          {gear.data?.items.length === 0 ? (
            <p className="text-body-sm text-text-muted">
              Nejprve přidejte položky do katalogu Výbava.
            </p>
          ) : null}
        </fieldset>
        {mutations.createTemplate.error ? (
          <InlineAlert variant="danger">
            {mutations.createTemplate.error.message}
          </InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" onClick={close}>
            Zrušit
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={mutations.createTemplate.isPending}
            disabled={!name.trim()}
          >
            Vytvořit gearlist
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
