import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  addShoppingItem,
  copyMealWeek,
  confirmShoppingGeneration,
  createMealEntry,
  createRecipe,
  createShoppingList,
  deleteMealEntry,
  deletePantryItem,
  generateShoppingPreview,
  getIngredients,
  getMealPlan,
  getMealsCalendarSummary,
  getMealsDashboard,
  getPantry,
  getRecipe,
  getRecipeMetadata,
  getRecipes,
  getShoppingCategories,
  getShoppingLists,
  savePantryItem,
  setShoppingItemChecked,
  updateRecipe,
  updateMealEntry,
} from '../api/mealsApi.js';
import { mealKeys } from '../mealQueryKeys.js';

export { MEALS_QUERY_KEY } from '../mealQueryKeys.js';

export const useRecipes = (
  filters: Parameters<typeof getRecipes>[0] = { page: 1, pageSize: 20 },
) =>
  useQuery({
    queryKey: mealKeys.recipeList(filters),
    queryFn: () => getRecipes(filters),
    placeholderData: keepPreviousData,
  });
export const useRecipe = (recipeId?: string) =>
  useQuery({
    queryKey: mealKeys.recipe(recipeId),
    queryFn: () => {
      if (!recipeId) throw new Error('Chybí identifikátor receptu.');
      return getRecipe(recipeId);
    },
    enabled: Boolean(recipeId),
  });
export const useIngredients = (search = '') =>
  useQuery({
    queryKey: mealKeys.ingredientSearch(search),
    queryFn: () => getIngredients(search),
  });
export const useRecipeMetadata = () =>
  useQuery({
    queryKey: mealKeys.recipeMetadata(),
    queryFn: getRecipeMetadata,
  });
export const useMealPlan = (dateFrom: string, dateTo: string) =>
  useQuery({
    queryKey: mealKeys.planRange(dateFrom, dateTo),
    queryFn: () => getMealPlan(dateFrom, dateTo),
  });
export const useShoppingLists = () =>
  useQuery({
    queryKey: mealKeys.shopping(),
    queryFn: getShoppingLists,
  });
export const useShoppingCategories = () =>
  useQuery({
    queryKey: mealKeys.shoppingCategories(),
    queryFn: getShoppingCategories,
  });
export const usePantry = () =>
  useQuery({ queryKey: mealKeys.pantry(), queryFn: getPantry });
export const useMealsDashboard = () =>
  useQuery({
    queryKey: mealKeys.dashboard(),
    queryFn: getMealsDashboard,
  });
export const useMealsCalendarSummary = (dateFrom: string, dateTo: string) =>
  useQuery({
    queryKey: mealKeys.calendarRange(dateFrom, dateTo),
    queryFn: () => getMealsCalendarSummary(dateFrom, dateTo),
  });

export function useMealsMutations() {
  const client = useQueryClient();
  const invalidate = (...queryKeys: readonly (readonly unknown[])[]) =>
    Promise.all(
      queryKeys.map((queryKey) => client.invalidateQueries({ queryKey })),
    );
  const refreshRecipes = () =>
    invalidate(mealKeys.recipes(), mealKeys.ingredients());
  const refreshMealPlan = () =>
    invalidate(mealKeys.plan(), mealKeys.calendar(), mealKeys.dashboard());
  const refreshShopping = () =>
    invalidate(mealKeys.shopping(), mealKeys.dashboard());
  return {
    createRecipe: useMutation({
      mutationFn: createRecipe,
      onSuccess: refreshRecipes,
    }),
    updateRecipe: useMutation({
      mutationFn: ({
        recipeId,
        input,
      }: {
        recipeId: string;
        input: Parameters<typeof updateRecipe>[1];
      }) => updateRecipe(recipeId, input),
      onSuccess: (recipe, { recipeId }) => {
        client.setQueryData(mealKeys.recipe(recipeId), recipe);
        return refreshRecipes();
      },
    }),
    createMeal: useMutation({
      mutationFn: createMealEntry,
      onSuccess: refreshMealPlan,
    }),
    updateMeal: useMutation({
      mutationFn: ({
        entryId,
        input,
      }: {
        entryId: string;
        input: Parameters<typeof updateMealEntry>[1];
      }) => updateMealEntry(entryId, input),
      onSuccess: refreshMealPlan,
    }),
    deleteMeal: useMutation({
      mutationFn: deleteMealEntry,
      onSuccess: refreshMealPlan,
    }),
    copyWeek: useMutation({
      mutationFn: copyMealWeek,
      onSuccess: refreshMealPlan,
    }),
    createList: useMutation({
      mutationFn: createShoppingList,
      onSuccess: refreshShopping,
    }),
    addItem: useMutation({
      mutationFn: ({
        listId,
        input,
      }: {
        listId: string;
        input: Parameters<typeof addShoppingItem>[1];
      }) => addShoppingItem(listId, input),
      onSuccess: refreshShopping,
    }),
    checkItem: useMutation({
      mutationFn: ({ itemId, checked }: { itemId: string; checked: boolean }) =>
        setShoppingItemChecked(itemId, checked),
      onMutate: async ({ itemId, checked }) => {
        await client.cancelQueries({
          queryKey: mealKeys.shopping(),
        });
        const previous = client.getQueryData(mealKeys.shopping());
        client.setQueriesData(
          { queryKey: mealKeys.shopping() },
          (current: unknown) => optimisticCheck(current, itemId, checked),
        );
        return { previous };
      },
      onError: (_error, _variables, context) => {
        if (context?.previous)
          client.setQueryData(mealKeys.shopping(), context.previous);
      },
      onSettled: refreshShopping,
    }),
    preview: useMutation({
      mutationFn: ({
        listId,
        input,
      }: {
        listId: string;
        input: Parameters<typeof generateShoppingPreview>[1];
      }) => generateShoppingPreview(listId, input),
    }),
    confirmGeneration: useMutation({
      mutationFn: ({
        listId,
        input,
      }: {
        listId: string;
        input: Parameters<typeof confirmShoppingGeneration>[1];
      }) => confirmShoppingGeneration(listId, input),
      onSuccess: refreshShopping,
    }),
    savePantry: useMutation({
      mutationFn: ({
        itemId,
        input,
      }: {
        itemId: string | null;
        input: Parameters<typeof savePantryItem>[1];
      }) => savePantryItem(itemId, input),
      onSuccess: () => invalidate(mealKeys.pantry()),
    }),
    deletePantry: useMutation({
      mutationFn: deletePantryItem,
      onSuccess: () => invalidate(mealKeys.pantry()),
    }),
  };
}

function optimisticCheck(current: unknown, itemId: string, checked: boolean) {
  if (!current || typeof current !== 'object' || !('items' in current))
    return current;
  const data = current as {
    items: { items: { id: string; checked: boolean }[] }[];
  };
  return {
    ...data,
    items: data.items.map((list) => ({
      ...list,
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, checked } : item,
      ),
    })),
  };
}
