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

export const MEALS_QUERY_KEY = ['meals'] as const;

export const useRecipes = (
  filters: Parameters<typeof getRecipes>[0] = { page: 1, pageSize: 20 },
) =>
  useQuery({
    queryKey: [...MEALS_QUERY_KEY, 'recipes', filters],
    queryFn: () => getRecipes(filters),
    placeholderData: keepPreviousData,
  });
export const useRecipe = (recipeId?: string) =>
  useQuery({
    queryKey: [...MEALS_QUERY_KEY, 'recipe', recipeId],
    queryFn: () => {
      if (!recipeId) throw new Error('Chybí identifikátor receptu.');
      return getRecipe(recipeId);
    },
    enabled: Boolean(recipeId),
  });
export const useIngredients = (search = '') =>
  useQuery({
    queryKey: [...MEALS_QUERY_KEY, 'ingredients', search],
    queryFn: () => getIngredients(search),
  });
export const useRecipeMetadata = () =>
  useQuery({
    queryKey: [...MEALS_QUERY_KEY, 'recipe-metadata'],
    queryFn: getRecipeMetadata,
  });
export const useMealPlan = (dateFrom: string, dateTo: string) =>
  useQuery({
    queryKey: [...MEALS_QUERY_KEY, 'plan', dateFrom, dateTo],
    queryFn: () => getMealPlan(dateFrom, dateTo),
  });
export const useShoppingLists = () =>
  useQuery({
    queryKey: [...MEALS_QUERY_KEY, 'shopping'],
    queryFn: getShoppingLists,
  });
export const useShoppingCategories = () =>
  useQuery({
    queryKey: [...MEALS_QUERY_KEY, 'shopping-categories'],
    queryFn: getShoppingCategories,
  });
export const usePantry = () =>
  useQuery({ queryKey: [...MEALS_QUERY_KEY, 'pantry'], queryFn: getPantry });
export const useMealsDashboard = () =>
  useQuery({
    queryKey: [...MEALS_QUERY_KEY, 'dashboard'],
    queryFn: getMealsDashboard,
  });
export const useMealsCalendarSummary = (dateFrom: string, dateTo: string) =>
  useQuery({
    queryKey: [...MEALS_QUERY_KEY, 'calendar', dateFrom, dateTo],
    queryFn: () => getMealsCalendarSummary(dateFrom, dateTo),
  });

export function useMealsMutations() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: MEALS_QUERY_KEY });
  return {
    createRecipe: useMutation({ mutationFn: createRecipe, onSuccess: refresh }),
    updateRecipe: useMutation({
      mutationFn: ({
        recipeId,
        input,
      }: {
        recipeId: string;
        input: Parameters<typeof updateRecipe>[1];
      }) => updateRecipe(recipeId, input),
      onSuccess: refresh,
    }),
    createMeal: useMutation({
      mutationFn: createMealEntry,
      onSuccess: refresh,
    }),
    updateMeal: useMutation({
      mutationFn: ({
        entryId,
        input,
      }: {
        entryId: string;
        input: Parameters<typeof updateMealEntry>[1];
      }) => updateMealEntry(entryId, input),
      onSuccess: refresh,
    }),
    deleteMeal: useMutation({
      mutationFn: deleteMealEntry,
      onSuccess: refresh,
    }),
    copyWeek: useMutation({ mutationFn: copyMealWeek, onSuccess: refresh }),
    createList: useMutation({
      mutationFn: createShoppingList,
      onSuccess: refresh,
    }),
    addItem: useMutation({
      mutationFn: ({
        listId,
        input,
      }: {
        listId: string;
        input: Parameters<typeof addShoppingItem>[1];
      }) => addShoppingItem(listId, input),
      onSuccess: refresh,
    }),
    checkItem: useMutation({
      mutationFn: ({ itemId, checked }: { itemId: string; checked: boolean }) =>
        setShoppingItemChecked(itemId, checked),
      onMutate: async ({ itemId, checked }) => {
        await client.cancelQueries({
          queryKey: [...MEALS_QUERY_KEY, 'shopping'],
        });
        const previous = client.getQueryData([...MEALS_QUERY_KEY, 'shopping']);
        client.setQueriesData(
          { queryKey: [...MEALS_QUERY_KEY, 'shopping'] },
          (current: unknown) => optimisticCheck(current, itemId, checked),
        );
        return { previous };
      },
      onError: (_error, _variables, context) => {
        if (context?.previous)
          client.setQueryData(
            [...MEALS_QUERY_KEY, 'shopping'],
            context.previous,
          );
      },
      onSettled: refresh,
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
      onSuccess: refresh,
    }),
    savePantry: useMutation({
      mutationFn: ({
        itemId,
        input,
      }: {
        itemId: string | null;
        input: Parameters<typeof savePantryItem>[1];
      }) => savePantryItem(itemId, input),
      onSuccess: refresh,
    }),
    deletePantry: useMutation({
      mutationFn: deletePantryItem,
      onSuccess: refresh,
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
