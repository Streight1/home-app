import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import {
  useMealsMutations,
  useShoppingCategories,
  useShoppingLists,
} from '../../hooks/useMeals.js';
import type {
  IngredientUnit,
  ShoppingItemInput,
} from '../../types/meals.types.js';
import { INGREDIENT_UNIT_OPTIONS } from '../recipes/recipeFormOptions.js';

const initialItem = (): ShoppingItemInput => ({
  text: '',
  quantity: null,
  unit: 'PIECE',
  shoppingCategoryId: null,
});

export function ShoppingItemDialog({
  open,
  onOpenChange,
  listId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId?: string;
}) {
  const lists = useShoppingLists();
  const categories = useShoppingCategories();
  const mutations = useMealsMutations();
  const [selectedListId, setSelectedListId] = useState(listId ?? '');
  const [value, setValue] = useState(initialItem);
  useEffect(() => {
    if (open && !selectedListId)
      setSelectedListId(
        listId ??
          lists.data?.items.find(({ status }) => status === 'OPEN')?.id ??
          '',
      );
  }, [listId, lists.data?.items, open, selectedListId]);
  const close = () => {
    setValue(initialItem());
    mutations.addItem.reset();
    onOpenChange(false);
  };
  return (
    <Dialog
      title="Přidat položku nákupu"
      description="Položka se sdílí s celou domácností."
      open={open}
      onOpenChange={(next) => !next && close()}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (selectedListId)
            mutations.addItem.mutate(
              { listId: selectedListId, input: value },
              { onSuccess: close },
            );
        }}
      >
        <Select
          label="Nákupní seznam"
          value={selectedListId}
          onChange={(event) => setSelectedListId(event.target.value)}
          required
        >
          <option value="">Vyberte seznam</option>
          {(lists.data?.items ?? [])
            .filter(({ status }) => status === 'OPEN')
            .map((list) => (
              <option key={list.id} value={list.id}>
                {list.title}
              </option>
            ))}
        </Select>
        {!lists.isLoading &&
        !lists.data?.items.some(({ status }) => status === 'OPEN') ? (
          <InlineAlert variant="warning">
            Nejprve vytvořte otevřený nákupní seznam.
          </InlineAlert>
        ) : null}
        <Input
          label="Položka"
          value={value.text}
          onChange={(event) =>
            setValue((current) => ({ ...current, text: event.target.value }))
          }
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Množství"
            inputMode="decimal"
            value={value.quantity ?? ''}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                quantity: event.target.value || null,
              }))
            }
          />
          <Select
            label="Jednotka"
            value={value.unit ?? ''}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                unit: event.target.value as IngredientUnit,
              }))
            }
          >
            {INGREDIENT_UNIT_OPTIONS.map(([unit, label]) => (
              <option key={unit} value={unit}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Select
          label="Kategorie obchodu"
          value={value.shoppingCategoryId ?? ''}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              shoppingCategoryId: event.target.value || null,
            }))
          }
        >
          <option value="">Bez kategorie</option>
          {(categories.data?.items ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        {mutations.addItem.isError ? (
          <InlineAlert variant="danger">
            {mutations.addItem.error.message}
          </InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" onClick={close}>
            Zrušit
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={mutations.addItem.isPending}
            disabled={!selectedListId || !value.text.trim()}
          >
            Přidat
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
