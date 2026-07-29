import { BookOpen, PackageOpen, ShoppingBasket, Soup } from 'lucide-react';
import type { HouseholdRole } from '../../household/household.public.js';
import { MealPlannerPanel } from '../components/planner/MealPlannerPanel.js';
import { PantryPanel } from '../components/pantry/PantryPanel.js';
import { RecipeListPanel } from '../components/recipes/RecipeListPanel.js';
import { ShoppingListPanel } from '../components/shopping/ShoppingListPanel.js';

export type MealsScreen = 'planner' | 'recipes' | 'shopping' | 'pantry';

const tabs = [
  ['planner', 'Jídelníček', Soup],
  ['recipes', 'Recepty', BookOpen],
  ['shopping', 'Nákup', ShoppingBasket],
  ['pantry', 'Zásoby', PackageOpen],
] as const;

export function MealsPage({
  screen,
  role,
  onScreenChange,
}: {
  screen: MealsScreen;
  role: HouseholdRole;
  onScreenChange: (screen: MealsScreen) => void;
}) {
  const canWrite = role !== 'VIEWER';
  return (
    <div className="grid gap-5">
      <header className="aurora-header-surface rounded-lg border border-border p-5 sm:p-6">
        <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
          Recepty, plán a společný nákup
        </p>
        <h1 className="mt-1 text-page-title font-semibold">
          Jídelníček a nákupy
        </h1>
        <p className="mt-2 max-w-2xl text-body-sm text-text-muted">
          Od receptu přes týdenní plán až po nákupní seznam s potvrzeným odečtem
          zásob.
        </p>
      </header>
      <nav
        className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface-raised p-1"
        aria-label="Sekce jídelníčku"
      >
        {tabs.map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-current={screen === value ? 'page' : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-md px-4 text-body-sm font-medium focus-visible:outline-2 focus-visible:outline-focus ${screen === value ? 'bg-selected-surface text-primary-emphasis' : 'text-text-muted hover:bg-surface-hover'}`}
            onClick={() => onScreenChange(value)}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      {screen === 'planner' ? <MealPlannerPanel canWrite={canWrite} /> : null}
      {screen === 'recipes' ? <RecipeListPanel canWrite={canWrite} /> : null}
      {screen === 'shopping' ? <ShoppingListPanel canWrite={canWrite} /> : null}
      {screen === 'pantry' ? <PantryPanel canWrite={canWrite} /> : null}
    </div>
  );
}
