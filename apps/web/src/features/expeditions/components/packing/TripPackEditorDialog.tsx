import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { useExpeditionMutations, useGear } from '../../hooks/useExpeditions.js';
import type {
  GearItem,
  Trip,
  TripPackItemInput,
} from '../../types/expeditions.types.js';
import { TripPackItemEditorRow } from './TripPackItemEditorRow.js';

const fromTrip = (trip: Trip): TripPackItemInput[] =>
  trip.items.map((item) => ({
    id: item.id,
    gearItemId: item.gearItemId,
    name: item.name,
    categoryName: item.categoryName ?? '',
    quantity: item.quantity,
    unitWeightGrams: item.unitWeightGrams,
    loadType: item.loadType,
    criticality: item.criticality,
    isShared: item.isShared,
    assignedUserId: item.assignedUserId,
    packingStatus: item.packingStatus,
    packLocationLabel: item.packLocationLabel ?? '',
    notes: item.notes ?? '',
  }));

const fromGear = (gear: GearItem): TripPackItemInput => ({
  gearItemId: gear.id,
  name: gear.name,
  categoryName: gear.category?.name ?? '',
  quantity: gear.defaultQuantity,
  unitWeightGrams: gear.weightGrams,
  loadType: gear.defaultLoadType,
  criticality: gear.defaultCriticality,
  isShared: gear.isHouseholdShared,
  assignedUserId: null,
  packingStatus: 'PLANNED',
  packLocationLabel: '',
  notes: '',
});

const customItem = (): TripPackItemInput => ({
  name: 'Nová položka',
  categoryName: '',
  quantity: '1',
  unitWeightGrams: 0,
  loadType: 'CARRIED',
  criticality: 'RECOMMENDED',
  isShared: false,
  assignedUserId: null,
  packingStatus: 'PLANNED',
  packLocationLabel: '',
  notes: '',
});

export function TripPackEditorDialog({
  trip,
  open,
  onOpenChange,
}: {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [items, setItems] = useState<TripPackItemInput[]>(() => fromTrip(trip));
  const [gearId, setGearId] = useState('');
  const gear = useGear({ page: 1, pageSize: 100 });
  const mutations = useExpeditionMutations();
  useEffect(() => {
    if (open) setItems(fromTrip(trip));
  }, [open, trip]);
  const close = () => {
    mutations.replaceItems.reset();
    setGearId('');
    onOpenChange(false);
  };
  const move = (index: number, offset: -1 | 1) => {
    setItems((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const value = next[index];
      const other = next[target];
      if (!value || !other) return current;
      next[index] = other;
      next[target] = value;
      return next;
    });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && close()}
      title="Upravit seznam výpravy"
      description="Změny platí jen pro tuto výpravu. Katalog výbavy ani původní gearlist se nezmění."
      size="wide"
      mobileFullScreen
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutations.replaceItems.mutate(
            { tripId: trip.id, items },
            { onSuccess: close },
          );
        }}
      >
        <div className="grid gap-2 rounded-lg border border-border p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Select
            label="Přidat z katalogu"
            value={gearId}
            onChange={(event) => setGearId(event.target.value)}
          >
            <option value="">Vyberte výbavu</option>
            {(gear.data?.items ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.weightGrams} g
              </option>
            ))}
          </Select>
          <Button
            type="button"
            disabled={!gearId}
            onClick={() => {
              const selected = gear.data?.items.find(({ id }) => id === gearId);
              if (selected) {
                setItems((current) => [...current, fromGear(selected)]);
                setGearId('');
              }
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Přidat
          </Button>
          <Button
            type="button"
            onClick={() => setItems((current) => [...current, customItem()])}
          >
            Vlastní položka
          </Button>
        </div>
        <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1">
          {items.map((item, index) => (
            <TripPackItemEditorRow
              key={item.id ?? `new-${String(index)}`}
              item={item}
              participants={trip.participants}
              first={index === 0}
              last={index === items.length - 1}
              onChange={(nextItem) =>
                setItems((current) =>
                  current.map((currentItem, currentIndex) =>
                    currentIndex === index ? nextItem : currentItem,
                  ),
                )
              }
              onMove={(offset) => move(index, offset)}
              onRemove={() =>
                setItems((current) =>
                  current.filter(
                    (_currentItem, currentIndex) => currentIndex !== index,
                  ),
                )
              }
            />
          ))}
        </div>
        {mutations.replaceItems.error ? (
          <InlineAlert variant="danger">
            {mutations.replaceItems.error.message}
          </InlineAlert>
        ) : null}
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-surface-raised py-3">
          <Button type="button" onClick={close}>
            Zrušit
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={mutations.replaceItems.isPending}
            disabled={
              mutations.replaceItems.isPending ||
              items.some(({ name }) => !name.trim())
            }
          >
            Uložit seznam
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
