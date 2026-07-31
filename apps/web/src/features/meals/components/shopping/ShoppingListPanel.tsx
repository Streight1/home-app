import { ListPlus, Plus, ShoppingBasket } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { addLocalDays } from '../../../../lib/date/dateOnly.js';
import { useMealsMutations, useShoppingLists } from '../../hooks/useMeals.js';
import { localDate, UNIT_LABELS } from '../../lib/decimalQuantity.js';
import type { ShoppingListItem } from '../../types/meals.types.js';
import { ShoppingGenerationPreview } from './ShoppingGenerationPreview.js';

export function ShoppingListPanel({ canWrite }: { canWrite: boolean }) {
  const workspace = useWorkspaceNavigation();
  const lists = useShoppingLists();
  const mutations = useMealsMutations();
  const [selectedListId, setSelectedListId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const selected =
    lists.data?.items.find(({ id }) => id === selectedListId) ??
    lists.data?.items.find(({ status }) => status === 'OPEN') ??
    null;
  const grouped = useMemo(() => {
    const groups = new Map<string, ShoppingListItem[]>();
    for (const item of selected?.items ?? []) {
      const key = item.category?.name ?? 'Ostatní';
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()];
  }, [selected]);
  const from = localDate();
  const to = localDate(addLocalDays(new Date(), 6));
  return (
    <section className="grid gap-4" aria-labelledby="shopping-list-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="shopping-list-title"
            className="text-section-title font-semibold"
          >
            Nákupní seznamy
          </h2>
          <p className="text-body-sm text-text-muted">
            Rychlé odškrtávání i položky z jídelníčku.
          </p>
        </div>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            {selected ? (
              <Button
                variant="primary"
                onClick={() =>
                  workspace.openOverlay({
                    kind: 'shopping-item-create',
                    listId: selected.id,
                  })
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Přidat položku
              </Button>
            ) : null}
            {selected ? (
              <Button onClick={() => setCreatingList((current) => !current)}>
                <ListPlus className="size-4" aria-hidden="true" />
                Nový seznam
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {lists.isError ? (
        <InlineAlert variant="danger">{lists.error.message}</InlineAlert>
      ) : null}
      {creatingList ? (
        <div className="grid gap-2 rounded-lg border border-border bg-surface-raised p-4 sm:grid-cols-[1fr_auto]">
          <Input
            label="Název nového seznamu"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
          />
          <Button
            className="self-end"
            variant="primary"
            loading={mutations.createList.isPending}
            disabled={!newTitle.trim()}
            onClick={() =>
              mutations.createList.mutate(
                { title: newTitle, isDefault: false },
                {
                  onSuccess: () => {
                    setNewTitle('');
                    setCreatingList(false);
                  },
                },
              )
            }
          >
            Vytvořit seznam
          </Button>
        </div>
      ) : null}
      {lists.data?.items.length ? (
        <Select
          label="Seznam"
          value={selected?.id ?? ''}
          onChange={(event) => setSelectedListId(event.target.value)}
        >
          {lists.data.items.map((list) => (
            <option key={list.id} value={list.id}>
              {list.title} · {list.openItemCount} otevřených
            </option>
          ))}
        </Select>
      ) : null}
      {!selected ? (
        <EmptyState
          eyebrow={
            <ShoppingBasket className="mx-auto size-5" aria-hidden="true" />
          }
          title="Zatím nemáte nákupní seznam"
          description="Vytvořte první sdílený seznam domácnosti."
          action={
            canWrite ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  label="Název seznamu"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                />
                <Button
                  variant="primary"
                  loading={mutations.createList.isPending}
                  disabled={!newTitle.trim()}
                  onClick={() =>
                    mutations.createList.mutate(
                      { title: newTitle, isDefault: true },
                      { onSuccess: () => setNewTitle('') },
                    )
                  }
                >
                  <ListPlus className="size-4" aria-hidden="true" />
                  Vytvořit
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-4">
            {grouped.map(([category, items]) => (
              <section
                key={category}
                className="rounded-lg border border-border bg-surface-raised p-4"
              >
                <h3 className="font-semibold">{category}</h3>
                <ul className="mt-2 divide-y divide-border">
                  {items.map((item) => (
                    <li key={item.id} className="py-2">
                      <label className="flex min-h-11 cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          className="size-6 accent-primary"
                          checked={item.checked}
                          disabled={!canWrite || mutations.checkItem.isPending}
                          onChange={(event) =>
                            mutations.checkItem.mutate({
                              itemId: item.id,
                              checked: event.target.checked,
                            })
                          }
                        />
                        <span
                          className={`min-w-0 flex-1 ${item.checked ? 'text-text-muted line-through' : ''}`}
                        >
                          {item.text}
                        </span>
                        <span className="shrink-0 text-body-sm text-text-muted">
                          {item.quantity ? `${item.quantity} ` : ''}
                          {item.unit
                            ? item.unit === 'CUSTOM'
                              ? item.customUnitLabel
                              : UNIT_LABELS[item.unit]
                            : ''}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {canWrite ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button onClick={() => setPreviewOpen(true)}>
                <ShoppingBasket className="size-4" aria-hidden="true" />
                Vytvořit z jídelníčku
              </Button>
            </div>
          ) : null}
          {previewOpen ? (
            <ShoppingGenerationPreview
              listId={selected.id}
              from={from}
              to={to}
              onClose={() => setPreviewOpen(false)}
            />
          ) : null}
        </>
      )}
    </section>
  );
}
