import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Switch } from '../../../../components/ui/Switch/Switch.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import type { RecipeInput } from '../../types/meals.types.js';

export function RecipeBasicFields({
  value,
  categories,
  tags,
  onChange,
}: {
  value: RecipeInput;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  onChange: (value: RecipeInput) => void;
}) {
  const update = (next: Partial<RecipeInput>) =>
    onChange({ ...value, ...next });
  return (
    <fieldset className="grid gap-4">
      <legend className="text-section-title font-semibold">
        Základní údaje
      </legend>
      <Input
        label="Název receptu"
        value={value.title}
        onChange={(event) => update({ title: event.target.value })}
        required
      />
      <Textarea
        label="Popis"
        value={value.description ?? ''}
        onChange={(event) => update({ description: event.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Input
          label="Počet porcí"
          inputMode="decimal"
          value={value.servings}
          onChange={(event) => update({ servings: event.target.value })}
          required
        />
        <Input
          label="Příprava (min)"
          type="number"
          min={0}
          value={value.preparationMinutes ?? ''}
          onChange={(event) =>
            update({
              preparationMinutes: event.target.value
                ? Number(event.target.value)
                : undefined,
            })
          }
        />
        <Input
          label="Vaření (min)"
          type="number"
          min={0}
          value={value.cookingMinutes ?? ''}
          onChange={(event) =>
            update({
              cookingMinutes: event.target.value
                ? Number(event.target.value)
                : undefined,
            })
          }
        />
        <Input
          label="Odpočinek (min)"
          type="number"
          min={0}
          value={value.restingMinutes ?? ''}
          onChange={(event) =>
            update({
              restingMinutes: event.target.value
                ? Number(event.target.value)
                : undefined,
            })
          }
        />
        <Select
          label="Obtížnost"
          value={value.difficulty}
          onChange={(event) =>
            update({
              difficulty: event.target.value as RecipeInput['difficulty'],
            })
          }
        >
          <option value="UNSPECIFIED">Neuvedeno</option>
          <option value="EASY">Snadné</option>
          <option value="MEDIUM">Střední</option>
          <option value="ADVANCED">Pokročilé</option>
        </Select>
      </div>
      <Select
        label="Kategorie"
        value={value.categoryId ?? ''}
        onChange={(event) => update({ categoryId: event.target.value || null })}
      >
        <option value="">Bez kategorie</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <fieldset>
        <legend className="mb-2 text-body-sm font-semibold">Tagy</legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3"
            >
              <input
                type="checkbox"
                checked={value.tagIds.includes(tag.id)}
                onChange={(event) =>
                  update({
                    tagIds: event.target.checked
                      ? [...value.tagIds, tag.id]
                      : value.tagIds.filter((id) => id !== tag.id),
                  })
                }
              />
              {tag.name}
            </label>
          ))}
          {!tags.length ? (
            <span className="text-body-sm text-text-muted">
              Zatím bez vlastních tagů.
            </span>
          ) : null}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Zdroj"
          value={value.sourceLabel ?? ''}
          onChange={(event) => update({ sourceLabel: event.target.value })}
        />
        <Input
          label="Odkaz na zdroj"
          type="url"
          value={value.sourceUrl ?? ''}
          onChange={(event) => update({ sourceUrl: event.target.value })}
        />
      </div>
      <div className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-border px-3 py-2">
        <span className="text-body-sm font-medium">Oblíbený recept</span>
        <Switch
          label="Oblíbený recept"
          checked={value.isFavorite}
          onCheckedChange={(isFavorite) => update({ isFavorite })}
        />
      </div>
      <Textarea
        label="Poznámky"
        value={value.notes ?? ''}
        onChange={(event) => update({ notes: event.target.value })}
      />
    </fieldset>
  );
}
