import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Switch } from '../../../../components/ui/Switch/Switch.js';
import { INGREDIENT_UNIT_OPTIONS } from './recipeFormOptions.js';
import type { RecipeIngredientInput } from '../../types/meals.types.js';

const emptyIngredient = (): RecipeIngredientInput => ({
  ingredientName: '',
  quantity: null,
  unit: 'G',
  isOptional: false,
});

export function RecipeIngredientFields({
  value,
  onChange,
}: {
  value: RecipeIngredientInput[];
  onChange: (value: RecipeIngredientInput[]) => void;
}) {
  const update = (index: number, next: Partial<RecipeIngredientInput>) =>
    onChange(
      value.map((item, position) =>
        position === index ? { ...item, ...next } : item,
      ),
    );
  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const currentItem = next[index];
    const targetItem = next[target];
    if (!currentItem || !targetItem) return;
    next[index] = targetItem;
    next[target] = currentItem;
    onChange(next);
  };
  return (
    <fieldset className="grid gap-3">
      <legend className="text-section-title font-semibold">Suroviny</legend>
      {value.map((item, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-12"
        >
          <div className="sm:col-span-5">
            <Input
              label={`Surovina ${String(index + 1)}`}
              value={item.ingredientName ?? ''}
              onChange={(event) =>
                update(index, {
                  ingredientName: event.target.value,
                  ingredientId: undefined,
                })
              }
              required
            />
          </div>
          <div className="sm:col-span-3">
            <Input
              label="Množství"
              inputMode="decimal"
              placeholder="např. 1.5"
              value={item.quantity ?? ''}
              disabled={item.unit === 'AS_NEEDED'}
              onChange={(event) =>
                update(index, { quantity: event.target.value || null })
              }
            />
          </div>
          <div className="sm:col-span-4">
            <Select
              label="Jednotka"
              value={item.unit}
              onChange={(event) =>
                update(index, {
                  unit: event.target.value as RecipeIngredientInput['unit'],
                  ...(event.target.value === 'AS_NEEDED'
                    ? { quantity: null }
                    : {}),
                })
              }
            >
              {INGREDIENT_UNIT_OPTIONS.map(([unit, label]) => (
                <option key={unit} value={unit}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          {item.unit === 'CUSTOM' ? (
            <div className="sm:col-span-5">
              <Input
                label="Název vlastní jednotky"
                value={item.customUnitLabel ?? ''}
                onChange={(event) =>
                  update(index, { customUnitLabel: event.target.value })
                }
                required
              />
            </div>
          ) : null}
          <div className="sm:col-span-7">
            <Input
              label="Úprava suroviny"
              placeholder="např. najemno"
              value={item.preparationNote ?? ''}
              onChange={(event) =>
                update(index, { preparationNote: event.target.value })
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-12">
            <span className="text-body-sm font-medium">Volitelná surovina</span>
            <Switch
              label="Volitelná surovina"
              checked={item.isOptional}
              onCheckedChange={(checked) =>
                update(index, { isOptional: checked })
              }
            />
            <span className="flex-1" />
            <IconButton
              type="button"
              aria-label="Posunout surovinu nahoru"
              onClick={() => move(index, -1)}
              disabled={index === 0}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              aria-label="Posunout surovinu dolů"
              onClick={() => move(index, 1)}
              disabled={index === value.length - 1}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              aria-label="Odstranit surovinu"
              variant="ghost"
              onClick={() =>
                onChange(value.filter((_, position) => position !== index))
              }
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      ))}
      <Button
        type="button"
        onClick={() => onChange([...value, emptyIngredient()])}
      >
        <Plus className="size-4" aria-hidden="true" />
        Přidat surovinu
      </Button>
    </fieldset>
  );
}
