import { Soup } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useMealsCalendarSummary } from '../../hooks/useMeals.js';
import { localDate, MEAL_TYPE_LABELS } from '../../lib/decimalQuantity.js';

export function MealsCalendarSummary({ date }: { date: Date }) {
  const workspace = useWorkspaceNavigation();
  const day = localDate(date);
  const summary = useMealsCalendarSummary(day, day);
  if (summary.isError)
    return (
      <InlineAlert variant="warning">
        Jídelníček pro tento den se nepodařilo načíst.
      </InlineAlert>
    );
  if (!summary.data?.items.length) return null;
  return (
    <aside
      className="rounded-lg border border-border bg-surface-raised p-4"
      aria-labelledby="calendar-meals-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="calendar-meals-title"
          className="flex items-center gap-2 font-semibold"
        >
          <Soup className="size-4" aria-hidden="true" />
          Jídelníček
        </h2>
        <Button
          onClick={() =>
            workspace.navigate({ area: 'meals', screen: 'planner' })
          }
        >
          Otevřít jídelníček
        </Button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {summary.data.items.map((meal) => (
          <li
            key={meal.id}
            className="rounded-md bg-selected-surface px-3 py-2 text-body-sm"
          >
            <strong>{MEAL_TYPE_LABELS[meal.mealType]}</strong> · {meal.title}
          </li>
        ))}
      </ul>
    </aside>
  );
}
