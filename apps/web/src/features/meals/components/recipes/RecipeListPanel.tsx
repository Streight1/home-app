import { Clock, Heart, Plus, Utensils } from 'lucide-react';
import { useState } from 'react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen/LoadingScreen.js';
import {
  useRecipe,
  useRecipeMetadata,
  useRecipes,
} from '../../hooks/useMeals.js';
import { RecipeDetail } from './RecipeDetail.js';

export function RecipeListPanel({
  canWrite,
  selectedRecipeId,
  onSelectRecipe,
  onCloseRecipe,
}: {
  canWrite: boolean;
  selectedRecipeId?: string;
  onSelectRecipe: (recipeId: string) => void;
  onCloseRecipe: () => void;
}) {
  const workspace = useWorkspaceNavigation();
  const [query, setQuery] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [tagId, setTagId] = useState('');
  const selected = useRecipe(selectedRecipeId);
  const metadata = useRecipeMetadata();
  const recipes = useRecipes({
    query,
    favoriteOnly,
    categoryId,
    tagId,
    page: 1,
    pageSize: 20,
  });
  if (selectedRecipeId && selected.isLoading)
    return <LoadingScreen message="Načítáme recept…" />;
  if (selectedRecipeId && selected.isError)
    return <InlineAlert variant="danger">{selected.error.message}</InlineAlert>;
  if (selected.data)
    return <RecipeDetail recipe={selected.data} onBack={onCloseRecipe} />;
  return (
    <section className="grid gap-4" aria-labelledby="recipes-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="recipes-title" className="text-section-title font-semibold">
            Recepty
          </h2>
          <p className="text-body-sm text-text-muted">
            Sdílená kuchařka domácnosti.
          </p>
        </div>
        {canWrite ? (
          <Button
            variant="primary"
            onClick={() => workspace.openOverlay({ kind: 'recipe-create' })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nový recept
          </Button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_14rem_14rem_auto]">
        <Input
          label="Hledat recept"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          label="Kategorie"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">Všechny kategorie</option>
          {(metadata.data?.items ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          label="Tag"
          value={tagId}
          onChange={(event) => setTagId(event.target.value)}
        >
          <option value="">Všechny tagy</option>
          {(metadata.data?.tags ?? []).map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          aria-pressed={favoriteOnly}
          onClick={() => setFavoriteOnly((current) => !current)}
        >
          <Heart className="size-4" aria-hidden="true" />
          Oblíbené
        </Button>
      </div>
      {recipes.isLoading ? <LoadingScreen message="Načítáme recepty…" /> : null}
      {recipes.isError ? (
        <InlineAlert variant="danger">{recipes.error.message}</InlineAlert>
      ) : null}
      {recipes.data?.items.length === 0 ? (
        <EmptyState
          eyebrow={<Utensils className="mx-auto size-5" aria-hidden="true" />}
          title="Zatím tu nejsou recepty"
          description="První recept vytvoří společnou kuchařku pro celou domácnost."
          action={
            canWrite ? (
              <Button
                variant="primary"
                onClick={() => workspace.openOverlay({ kind: 'recipe-create' })}
              >
                Nový recept
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(recipes.data?.items ?? []).map((recipe) => (
          <button
            key={recipe.id}
            type="button"
            className="min-h-32 rounded-lg border border-border bg-surface-raised p-4 text-left shadow-sm transition hover:border-border-strong hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
            onClick={() => onSelectRecipe(recipe.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <strong>{recipe.title}</strong>
              {recipe.isFavorite ? (
                <Heart
                  className="size-4 fill-current text-danger"
                  aria-label="Oblíbený recept"
                />
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-body-sm text-text-muted">
              {recipe.description ?? 'Bez popisu'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{recipe.servings} porce</Badge>
              {recipe.preparationMinutes ? (
                <Badge>
                  <Clock className="mr-1 inline size-3" aria-hidden="true" />
                  {recipe.preparationMinutes} min
                </Badge>
              ) : null}
              {recipe.category ? <Badge>{recipe.category.name}</Badge> : null}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
