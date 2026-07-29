import { Pencil, PackageOpen, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import {
  useIngredients,
  useMealsMutations,
  usePantry,
} from '../../hooks/useMeals.js';
import { UNIT_LABELS } from '../../lib/decimalQuantity.js';
import type { IngredientUnit, PantryItem } from '../../types/meals.types.js';
import { INGREDIENT_UNIT_OPTIONS } from '../recipes/recipeFormOptions.js';

export function PantryPanel({ canWrite }: { canWrite: boolean }) {
  const pantry = usePantry();
  const ingredients = useIngredients();
  const mutations = useMealsMutations();
  const [ingredientId, setIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<IngredientUnit>('G');
  const [status, setStatus] = useState<PantryItem['status']>('AVAILABLE');
  const [expiresOn, setExpiresOn] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
    null,
  );
  const resetForm = () => {
    setIngredientId('');
    setQuantity('');
    setUnit('G');
    setStatus('AVAILABLE');
    setExpiresOn('');
    setLocationLabel('');
    setNote('');
    setEditingId(null);
  };
  const edit = (item: PantryItem) => {
    setEditingId(item.id);
    setIngredientId(item.ingredient.id);
    setQuantity(item.quantity ?? '');
    setUnit(item.unit ?? 'G');
    setStatus(item.status);
    setExpiresOn(item.expiresOn ?? '');
    setLocationLabel(item.locationLabel ?? '');
    setNote(item.note ?? '');
  };
  return (
    <section className="grid gap-4" aria-labelledby="pantry-title">
      <div>
        <h2 id="pantry-title" className="text-section-title font-semibold">
          Domácí zásoby
        </h2>
        <p className="text-body-sm text-text-muted">
          Orientační přehled, nikoliv skladové hospodářství.
        </p>
      </div>
      {canWrite ? (
        <form
          className="grid gap-3 rounded-lg border border-border bg-surface-raised p-4 sm:grid-cols-2 xl:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutations.savePantry.mutate(
              {
                itemId: editingId,
                input: {
                  ingredientId,
                  quantity: quantity || null,
                  unit,
                  status,
                  expiresOn: expiresOn || null,
                  locationLabel,
                  note,
                },
              },
              { onSuccess: resetForm },
            );
          }}
        >
          <Select
            label="Surovina"
            value={ingredientId}
            onChange={(event) => setIngredientId(event.target.value)}
            required
          >
            <option value="">Vyberte surovinu</option>
            {(ingredients.data?.items ?? []).map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.name}
              </option>
            ))}
          </Select>
          <Input
            label="Množství"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <Select
            label="Jednotka"
            value={unit}
            onChange={(event) => setUnit(event.target.value as IngredientUnit)}
          >
            {INGREDIENT_UNIT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            label="Stav"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as PantryItem['status'])
            }
          >
            <option value="AVAILABLE">Doma</option>
            <option value="LOW">Dochází</option>
            <option value="OUT">Došlo</option>
            <option value="UNKNOWN">Neznámý</option>
          </Select>
          <DatePicker
            label="Spotřebovat do"
            value={expiresOn}
            onChange={setExpiresOn}
          />
          <Input
            label="Umístění"
            value={locationLabel}
            onChange={(event) => setLocationLabel(event.target.value)}
          />
          <Input
            label="Poznámka"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="flex items-end justify-end gap-2">
            {editingId ? (
              <Button type="button" onClick={resetForm}>
                Zrušit
              </Button>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              disabled={!ingredientId}
              loading={mutations.savePantry.isPending}
            >
              <Plus className="size-4" aria-hidden="true" />
              {editingId ? 'Uložit' : 'Přidat'}
            </Button>
          </div>
        </form>
      ) : null}
      {pantry.isError ? (
        <InlineAlert variant="danger">{pantry.error.message}</InlineAlert>
      ) : null}
      {pantry.data?.items.length === 0 ? (
        <EmptyState
          eyebrow={
            <PackageOpen className="mx-auto size-5" aria-hidden="true" />
          }
          title="Zásoby zatím neevidujete"
          description="Přidejte jen suroviny, které chcete zohlednit při nákupu."
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(pantry.data?.items ?? []).map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-border bg-surface-raised p-4"
          >
            <strong>{item.ingredient.name}</strong>
            <p className="mt-1 text-body-sm text-text-muted">
              {item.quantity ? `${item.quantity} ` : 'Množství neuvedeno'}
              {item.unit ? UNIT_LABELS[item.unit] : ''}
            </p>
            <p className="mt-2 text-caption font-semibold uppercase text-primary-emphasis">
              {item.status === 'LOW'
                ? 'Dochází'
                : item.status === 'OUT'
                  ? 'Došlo'
                  : item.status === 'AVAILABLE'
                    ? 'Doma'
                    : 'Neznámý stav'}
            </p>
            {item.expiresOn ? (
              <p className="mt-2 text-body-sm text-text-muted">
                Spotřebovat do {item.expiresOn}
              </p>
            ) : null}
            {item.locationLabel ? (
              <p className="text-body-sm text-text-muted">
                {item.locationLabel}
              </p>
            ) : null}
            {canWrite ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={() => edit(item)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Upravit
                </Button>
                {deleteCandidateId === item.id ? (
                  <>
                    <Button onClick={() => setDeleteCandidateId(null)}>
                      Zpět
                    </Button>
                    <Button
                      variant="danger"
                      loading={mutations.deletePantry.isPending}
                      onClick={() =>
                        mutations.deletePantry.mutate(item.id, {
                          onSuccess: () => setDeleteCandidateId(null),
                        })
                      }
                    >
                      Potvrdit smazání
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setDeleteCandidateId(item.id)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Odstranit
                  </Button>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
