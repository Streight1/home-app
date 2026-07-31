import { ChevronLeft, ChevronRight, Copy, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Avatar } from '../../../../components/ui/Avatar/Avatar.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen/LoadingScreen.js';
import {
  addLocalDays,
  startOfLocalWeek,
} from '../../../../lib/date/dateOnly.js';
import { useMealPlan, useMealsMutations } from '../../hooks/useMeals.js';
import { localDate, MEAL_TYPE_LABELS } from '../../lib/decimalQuantity.js';

const weekStart = (value = new Date()) => {
  const date = startOfLocalWeek(value);
  date.setHours(12, 0, 0, 0);
  return date;
};

export function MealPlannerPanel({ canWrite }: { canWrite: boolean }) {
  const workspace = useWorkspaceNavigation();
  const [start, setStart] = useState(() => weekStart());
  const [copyOpen, setCopyOpen] = useState(false);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addLocalDays(start, index)),
    [start],
  );
  const from = localDate(days[0]);
  const to = localDate(days[6]);
  const plan = useMealPlan(from, to);
  const mutations = useMealsMutations();
  return (
    <section className="grid gap-4" aria-labelledby="meal-plan-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="meal-plan-title" className="text-section-title font-semibold">
            Týdenní jídelníček
          </h2>
          <p className="text-body-sm text-text-muted">
            {days[0]?.toLocaleDateString('cs-CZ')} –{' '}
            {days[6]?.toLocaleDateString('cs-CZ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            aria-label="Předchozí týden"
            onClick={() => setStart((current) => addLocalDays(current, -7))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button onClick={() => setStart(weekStart())}>Tento týden</Button>
          <Button
            aria-label="Následující týden"
            onClick={() => setStart((current) => addLocalDays(current, 7))}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          {canWrite ? (
            <Button
              variant="primary"
              onClick={() =>
                workspace.openOverlay({
                  kind: 'meal-plan-create',
                  plannedFor: from,
                })
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Přidat jídlo
            </Button>
          ) : null}
        </div>
      </div>
      {plan.isLoading ? <LoadingScreen message="Načítáme jídelníček…" /> : null}
      {plan.isError ? (
        <InlineAlert variant="danger">{plan.error.message}</InlineAlert>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-7">
        {days.map((day) => {
          const date = localDate(day);
          const entries =
            plan.data?.items.filter(({ plannedFor }) => plannedFor === date) ??
            [];
          return (
            <section
              key={date}
              className="min-w-0 rounded-lg border border-border bg-surface-raised p-3"
            >
              <h3 className="font-semibold capitalize">
                {day.toLocaleDateString('cs-CZ', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'numeric',
                })}
              </h3>
              <div className="mt-3 grid gap-2">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="rounded-md border border-border bg-selected-surface p-2 text-left focus-visible:outline-2 focus-visible:outline-focus"
                    onClick={() =>
                      workspace.openOverlay({
                        kind: 'meal-plan-edit',
                        entryId: entry.id,
                        plannedFor: entry.plannedFor,
                      })
                    }
                  >
                    <span className="block text-caption font-semibold text-primary-emphasis">
                      {MEAL_TYPE_LABELS[entry.mealType]}
                    </span>
                    <strong className="block truncate text-body-sm">
                      {entry.title}
                    </strong>
                    <span className="mt-2 flex -space-x-1">
                      {entry.participants.map((participant) => (
                        <Avatar
                          key={participant.id}
                          name={participant.displayName}
                          imageUrl={participant.avatarUrl}
                          size="sm"
                        />
                      ))}
                    </span>
                  </button>
                ))}
                {canWrite ? (
                  <Button
                    className="w-full"
                    onClick={() =>
                      workspace.openOverlay({
                        kind: 'meal-plan-create',
                        plannedFor: date,
                      })
                    }
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Přidat
                  </Button>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      {canWrite ? (
        <div className="flex justify-end">
          <Button
            loading={mutations.copyWeek.isPending}
            onClick={() => setCopyOpen(true)}
          >
            <Copy className="size-4" aria-hidden="true" />
            Kopírovat do dalšího týdne
          </Button>
        </div>
      ) : null}
      <Dialog
        title="Kopírovat jídelníček do dalšího týdne?"
        description="Existující položky v cílovém týdnu zůstanou zachované; doplní se pouze volná místa."
        open={copyOpen}
        onOpenChange={setCopyOpen}
      >
        <p className="text-body-sm text-text-muted">
          Zkopíruje se týden {from} do týdne začínajícího{' '}
          {localDate(addLocalDays(start, 7))}.
        </p>
        {mutations.copyWeek.isError ? (
          <InlineAlert variant="danger">
            {mutations.copyWeek.error.message}
          </InlineAlert>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => setCopyOpen(false)}>Zpět</Button>
          <Button
            variant="primary"
            loading={mutations.copyWeek.isPending}
            onClick={() =>
              mutations.copyWeek.mutate(
                {
                  sourceWeekStart: from,
                  targetWeekStart: localDate(addLocalDays(start, 7)),
                  replaceExisting: false,
                  confirmed: true,
                },
                { onSuccess: () => setCopyOpen(false) },
              )
            }
          >
            Potvrdit kopírování
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
