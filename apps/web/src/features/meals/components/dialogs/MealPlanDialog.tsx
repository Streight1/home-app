import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import { useCurrentUser } from '../../../auth/hooks/useCurrentUser.js';
import {
  useMealPlan,
  useMealsMutations,
  useRecipes,
} from '../../hooks/useMeals.js';
import { localDate, MEAL_TYPE_LABELS } from '../../lib/decimalQuantity.js';
import type { MealPlanInput, MealType } from '../../types/meals.types.js';
import { MealParticipantPicker } from '../planner/MealParticipantPicker.js';

const initialMeal = (plannedFor: string, userId?: string): MealPlanInput => ({
  plannedFor,
  mealType: 'DINNER',
  recipeId: null,
  title: '',
  servings: '2',
  notes: '',
  participantUserIds: userId ? [userId] : [],
});

export function MealPlanDialog({
  open,
  onOpenChange,
  plannedFor = localDate(),
  recipeId,
  entryId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plannedFor?: string;
  recipeId?: string;
  entryId?: string;
}) {
  const auth = useCurrentUser();
  const [value, setValue] = useState(() => initialMeal(plannedFor));
  const week = useMemo(
    () => ({ from: plannedFor, to: plannedFor }),
    [plannedFor],
  );
  const planning = useMealPlan(week.from, week.to);
  const recipes = useRecipes({ page: 1, pageSize: 100 });
  const mutations = useMealsMutations();
  useEffect(() => {
    if (!open || !entryId) return;
    const entry = planning.data?.items.find(({ id }) => id === entryId);
    if (entry)
      setValue({
        plannedFor: entry.plannedFor,
        mealType: entry.mealType,
        ...(entry.customMealTypeLabel
          ? { customMealTypeLabel: entry.customMealTypeLabel }
          : {}),
        recipeId: entry.recipe?.id ?? null,
        title: entry.title,
        servings: entry.servings,
        notes: entry.notes ?? '',
        participantUserIds: entry.participants.map(({ id }) => id),
      });
  }, [entryId, open, planning.data?.items]);
  useEffect(() => {
    if (!open || !recipeId) return;
    const recipe = recipes.data?.items.find(({ id }) => id === recipeId);
    if (recipe)
      setValue((current) => ({
        ...current,
        recipeId,
        title: recipe.title,
        servings: recipe.servings,
      }));
  }, [open, recipeId, recipes.data?.items]);
  useEffect(() => {
    const currentUserId = auth.data?.user.id;
    if (open && !value.participantUserIds.length && currentUserId)
      setValue((current) => ({
        ...current,
        participantUserIds: [currentUserId],
      }));
  }, [auth.data, open, value.participantUserIds.length]);
  const close = () => {
    setValue(initialMeal(plannedFor, auth.data?.user.id));
    mutations.createMeal.reset();
    mutations.updateMeal.reset();
    mutations.deleteMeal.reset();
    onOpenChange(false);
  };
  const pending =
    mutations.createMeal.isPending || mutations.updateMeal.isPending;
  const error =
    mutations.createMeal.error ??
    mutations.updateMeal.error ??
    mutations.deleteMeal.error;
  return (
    <Dialog
      title={entryId ? 'Upravit naplánované jídlo' : 'Naplánovat jídlo'}
      description="Recept je volitelný; naplánovat lze i vlastní jídlo."
      size="lg"
      mobileFullScreen
      open={open}
      onOpenChange={(next) => !next && close()}
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (entryId)
            mutations.updateMeal.mutate(
              { entryId, input: value },
              { onSuccess: close },
            );
          else mutations.createMeal.mutate(value, { onSuccess: close });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker
            label="Den"
            value={value.plannedFor}
            onChange={(plannedForValue) =>
              setValue((current) => ({
                ...current,
                plannedFor: plannedForValue,
              }))
            }
          />
          <Select
            label="Typ jídla"
            value={value.mealType}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                mealType: event.target.value as MealType,
              }))
            }
          >
            {Object.entries(MEAL_TYPE_LABELS).map(([mealType, label]) => (
              <option key={mealType} value={mealType}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Select
          label="Recept"
          value={value.recipeId ?? ''}
          onChange={(event) => {
            const recipe = recipes.data?.items.find(
              ({ id }) => id === event.target.value,
            );
            setValue((current) => ({
              ...current,
              recipeId: event.target.value || null,
              ...(recipe
                ? { title: recipe.title, servings: recipe.servings }
                : {}),
            }));
          }}
        >
          <option value="">Bez receptu</option>
          {(recipes.data?.items ?? []).map((recipe) => (
            <option key={recipe.id} value={recipe.id}>
              {recipe.title}
            </option>
          ))}
        </Select>
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <Input
            label="Název jídla"
            value={value.title}
            onChange={(event) =>
              setValue((current) => ({ ...current, title: event.target.value }))
            }
            required
          />
          <Input
            label="Porce"
            inputMode="decimal"
            value={value.servings}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                servings: event.target.value,
              }))
            }
            required
          />
        </div>
        <MealParticipantPicker
          members={
            planning.data?.members.map((member) => ({
              id: member.id,
              displayName: member.displayName,
              avatarUrl: member.avatarUrl,
              colorToken: member.calendarColorToken,
            })) ?? []
          }
          selected={value.participantUserIds}
          onChange={(participantUserIds) =>
            setValue((current) => ({ ...current, participantUserIds }))
          }
        />
        <Textarea
          label="Poznámka"
          value={value.notes ?? ''}
          onChange={(event) =>
            setValue((current) => ({ ...current, notes: event.target.value }))
          }
        />
        {error ? (
          <InlineAlert variant="danger">{error.message}</InlineAlert>
        ) : null}
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-surface-raised py-3">
          {entryId ? (
            <Button
              type="button"
              variant="danger"
              loading={mutations.deleteMeal.isPending}
              onClick={() =>
                mutations.deleteMeal.mutate(entryId, { onSuccess: close })
              }
            >
              Odstranit jídlo
            </Button>
          ) : null}
          <Button type="button" onClick={close}>
            Zrušit
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            disabled={!value.title.trim() || !value.servings}
          >
            {entryId ? 'Uložit změny' : 'Naplánovat'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
