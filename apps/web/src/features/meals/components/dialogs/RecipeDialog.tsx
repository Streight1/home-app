import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import {
  useMealsMutations,
  useRecipe,
  useRecipeMetadata,
} from '../../hooks/useMeals.js';
import type { Recipe, RecipeInput } from '../../types/meals.types.js';
import { RecipeBasicFields } from '../recipes/RecipeBasicFields.js';
import { RecipeDocumentFields } from '../recipes/RecipeDocumentFields.js';
import { RecipeIngredientFields } from '../recipes/RecipeIngredientFields.js';
import { RecipeStepFields } from '../recipes/RecipeStepFields.js';

const initialRecipe = (): RecipeInput => ({
  title: '',
  description: '',
  servings: '2',
  difficulty: 'UNSPECIFIED',
  categoryId: null,
  notes: '',
  isFavorite: false,
  tagIds: [],
  ingredients: [],
  steps: [],
  documents: [],
});

const editRecipe = (recipe: Recipe): RecipeInput => ({
  title: recipe.title,
  description: recipe.description ?? '',
  servings: recipe.servings,
  preparationMinutes: recipe.preparationMinutes,
  cookingMinutes: recipe.cookingMinutes,
  restingMinutes: recipe.restingMinutes,
  difficulty: recipe.difficulty,
  categoryId: recipe.category?.id ?? null,
  sourceLabel: recipe.sourceLabel ?? '',
  sourceUrl: recipe.sourceUrl ?? '',
  notes: recipe.notes ?? '',
  isFavorite: recipe.isFavorite,
  tagIds: recipe.tags.map(({ id }) => id),
  ingredients: recipe.ingredients.map((ingredient) => ({
    ingredientId: ingredient.ingredientId,
    ingredientName: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    customUnitLabel: ingredient.customUnitLabel ?? undefined,
    preparationNote: ingredient.preparationNote ?? undefined,
    isOptional: ingredient.isOptional,
    groupLabel: ingredient.groupLabel ?? undefined,
  })),
  steps: recipe.steps.map((step) => ({
    title: step.title ?? undefined,
    instruction: step.instruction,
    durationMinutes: step.durationMinutes ?? undefined,
  })),
  documents: recipe.documents,
});

export function RecipeDialog({
  open,
  onOpenChange,
  recipeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId?: string;
}) {
  const [value, setValue] = useState(initialRecipe);
  const metadata = useRecipeMetadata();
  const recipe = useRecipe(recipeId);
  const mutations = useMealsMutations();
  useEffect(() => {
    if (open && recipe.data) setValue(editRecipe(recipe.data));
  }, [open, recipe.data]);
  const close = () => {
    setValue(initialRecipe());
    mutations.createRecipe.reset();
    mutations.updateRecipe.reset();
    onOpenChange(false);
  };
  const pending =
    mutations.createRecipe.isPending || mutations.updateRecipe.isPending;
  const error = mutations.createRecipe.error ?? mutations.updateRecipe.error;
  return (
    <Dialog
      title={recipeId ? 'Upravit recept' : 'Nový recept'}
      description="Uložte suroviny, porce a postup na jednom místě."
      size="lg"
      mobileFullScreen
      open={open}
      onOpenChange={(next) => !next && close()}
    >
      <form
        className="grid gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (recipeId)
            mutations.updateRecipe.mutate(
              { recipeId, input: value },
              { onSuccess: close },
            );
          else mutations.createRecipe.mutate(value, { onSuccess: close });
        }}
      >
        <RecipeBasicFields
          value={value}
          categories={metadata.data?.items ?? []}
          tags={metadata.data?.tags ?? []}
          onChange={setValue}
        />
        <RecipeIngredientFields
          value={value.ingredients}
          onChange={(ingredients) =>
            setValue((current) => ({ ...current, ingredients }))
          }
        />
        <RecipeStepFields
          value={value.steps}
          onChange={(steps) => setValue((current) => ({ ...current, steps }))}
        />
        <RecipeDocumentFields
          value={value.documents}
          onChange={(documents) =>
            setValue((current) => ({ ...current, documents }))
          }
        />
        {recipe.isError ? (
          <InlineAlert variant="danger">{recipe.error.message}</InlineAlert>
        ) : null}
        {error ? (
          <InlineAlert variant="danger">{error.message}</InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" onClick={close}>
            Zrušit
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            disabled={!value.title.trim() || !value.servings}
          >
            {recipeId ? 'Uložit změny' : 'Vytvořit recept'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
