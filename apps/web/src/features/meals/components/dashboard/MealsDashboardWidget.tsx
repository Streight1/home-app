import { ArrowRight, CalendarPlus, Plus, Soup } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useMealsDashboard } from '../../hooks/useMeals.js';
import { MEAL_TYPE_LABELS } from '../../lib/decimalQuantity.js';

export function MealsDashboardWidget({
  canWrite = true,
}: {
  canWrite?: boolean;
}) {
  const workspace = useWorkspaceNavigation();
  const dashboard = useMealsDashboard();
  return (
    <section className="md:col-span-12" aria-labelledby="meals-dashboard-title">
      <div className="rounded-lg border border-border bg-surface-raised p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              Jídlo a společný nákup
            </p>
            <h2
              id="meals-dashboard-title"
              className="mt-1 text-section-title font-semibold"
            >
              Jídelníček a nákup
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite ? (
              <Button
                onClick={() =>
                  workspace.openOverlay({ kind: 'meal-plan-create' })
                }
              >
                <CalendarPlus className="size-4" aria-hidden="true" />
                Přidat jídlo
              </Button>
            ) : null}
            {canWrite ? (
              <Button
                onClick={() =>
                  workspace.openOverlay({ kind: 'shopping-item-create' })
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Přidat položku
              </Button>
            ) : null}
            <Button
              onClick={() =>
                workspace.navigate({ area: 'meals', screen: 'planner' })
              }
            >
              Zobrazit jídelníček
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button
              onClick={() =>
                workspace.navigate({ area: 'meals', screen: 'shopping' })
              }
            >
              Otevřít nákupní seznam
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        {dashboard.isLoading ? (
          <p className="mt-4 text-body-sm text-text-muted">
            Načítáme jídelníček…
          </p>
        ) : null}
        {dashboard.isError ? (
          <div className="mt-4">
            <InlineAlert variant="danger">
              Přehled jídel se nepodařilo načíst.
              <button
                type="button"
                className="ml-3 min-h-11 px-3 font-medium underline"
                onClick={() => void dashboard.refetch()}
              >
                Zkusit znovu
              </button>
            </InlineAlert>
          </div>
        ) : null}
        {dashboard.data?.todayMeals.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dashboard.data.todayMeals.map((meal) => (
              <article
                key={meal.id}
                className="rounded-md border border-border bg-surface p-3"
              >
                <p className="text-caption font-semibold text-primary-emphasis">
                  {MEAL_TYPE_LABELS[meal.mealType]}
                </p>
                <strong className="mt-1 block">{meal.title}</strong>
                <span className="text-caption text-text-muted">
                  {meal.servings} porce
                </span>
              </article>
            ))}
          </div>
        ) : null}
        {dashboard.data && dashboard.data.todayMeals.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              compact
              eyebrow={<Soup className="mx-auto size-5" aria-hidden="true" />}
              title="Na dnešek není naplánované jídlo"
              description="Jídelníček je skutečně prázdný; nákupní seznam zůstává dostupný samostatně."
            />
          </div>
        ) : null}
        {dashboard.data?.shoppingList ? (
          <p className="mt-4 text-body-sm text-text-muted">
            <strong>{dashboard.data.shoppingList.openItemCount}</strong>{' '}
            otevřených položek v seznamu {dashboard.data.shoppingList.title}.
          </p>
        ) : null}
      </div>
    </section>
  );
}
