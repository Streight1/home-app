import { ArrowLeft, CalendarPlus, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import {
  scaleDecimalQuantity,
  UNIT_LABELS,
} from '../../lib/decimalQuantity.js';
import type { Recipe } from '../../types/meals.types.js';

export function RecipeDetail({
  recipe,
  onBack,
}: {
  recipe: Recipe;
  onBack: () => void;
}) {
  const workspace = useWorkspaceNavigation();
  const [servings, setServings] = useState(recipe.servings);
  return (
    <article className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button onClick={onBack}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Zpět na recepty
          </Button>
          <h2 className="mt-3 text-page-title font-semibold">{recipe.title}</h2>
          <p className="mt-2 text-text-muted">{recipe.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              workspace.openOverlay({
                kind: 'recipe-edit',
                recipeId: recipe.id,
              })
            }
          >
            <Pencil className="size-4" aria-hidden="true" />
            Upravit recept
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              workspace.openOverlay({
                kind: 'meal-plan-create',
                recipeId: recipe.id,
              })
            }
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            Přidat do jídelníčku
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {recipe.tags.map((tag) => (
          <Badge key={tag.id}>{tag.name}</Badge>
        ))}
      </div>
      <section className="rounded-lg border border-border bg-surface-raised p-5">
        <div className="mb-4 max-w-48">
          <Input
            label="Počet porcí"
            inputMode="decimal"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
          />
        </div>
        <h3 className="text-section-title font-semibold">Suroviny</h3>
        <ul className="mt-3 divide-y divide-border">
          {recipe.ingredients.map((ingredient) => {
            let quantity = ingredient.quantity;
            try {
              quantity =
                ingredient.unit === 'AS_NEEDED'
                  ? null
                  : scaleDecimalQuantity(
                      ingredient.quantity,
                      recipe.servings,
                      servings,
                    );
            } catch {
              quantity = ingredient.quantity;
            }
            return (
              <li
                key={ingredient.id}
                className="flex justify-between gap-4 py-3"
              >
                <span>
                  {ingredient.name}
                  {ingredient.preparationNote
                    ? ` · ${ingredient.preparationNote}`
                    : ''}
                </span>
                <strong className="shrink-0">
                  {quantity ? `${quantity} ` : ''}
                  {ingredient.unit === 'CUSTOM'
                    ? ingredient.customUnitLabel
                    : UNIT_LABELS[ingredient.unit]}
                </strong>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="rounded-lg border border-border bg-surface-raised p-5">
        <h3 className="text-section-title font-semibold">Postup</h3>
        <ol className="mt-4 grid gap-4">
          {recipe.steps.map((step, index) => (
            <li key={step.id} className="grid grid-cols-[2rem_1fr] gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                {index + 1}
              </span>
              <div>
                <strong>{step.title}</strong>
                <p className="mt-1 whitespace-pre-wrap text-body-sm text-text-muted">
                  {step.instruction}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
