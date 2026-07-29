import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  IngredientSummary,
  MealPlanEntry,
  MealPlanInput,
  MealsDashboard,
  PantryItem,
  Recipe,
  RecipeInput,
  ShoppingItemInput,
  ShoppingList,
} from '../types/meals.types.js';

const query = (
  input: Record<string, string | number | boolean | undefined>,
) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value !== undefined && value !== '') params.set(key, String(value));
  return params.toString();
};

export const getRecipes = (filters: {
  query?: string;
  categoryId?: string;
  tagId?: string;
  favoriteOnly?: boolean;
  archived?: boolean;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}) =>
  apiRequest<{
    items: Recipe[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }>(`/recipes?${query(filters)}`);

export const getRecipe = (recipeId: string) =>
  apiRequest<Recipe>(`/recipes/${recipeId}`);
export const createRecipe = (input: RecipeInput) =>
  apiRequest<Recipe>('/recipes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const updateRecipe = (recipeId: string, input: RecipeInput) =>
  apiRequest<Recipe>(`/recipes/${recipeId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
export const getScaledRecipe = (recipeId: string, servings: string) =>
  apiRequest<Recipe>(`/recipes/${recipeId}/scaled?${query({ servings })}`);

export const getIngredients = (search = '') =>
  apiRequest<{ items: IngredientSummary[] }>(
    `/ingredients?${query({ query: search })}`,
  );
export const getRecipeMetadata = () =>
  apiRequest<{
    items: { id: string; name: string; iconKey: string; colorToken: string }[];
    tags: { id: string; name: string }[];
  }>('/recipe-categories');
export const getShoppingCategories = () =>
  apiRequest<{
    items: {
      id: string;
      name: string;
      sortOrder: number;
      colorToken: string;
    }[];
  }>('/shopping-categories');

export const getMealPlan = (dateFrom: string, dateTo: string) =>
  apiRequest<{
    items: MealPlanEntry[];
    members: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
      calendarColorToken: string;
    }[];
  }>(`/meal-plan?${query({ dateFrom, dateTo })}`);
export const createMealEntry = (input: MealPlanInput) =>
  apiRequest<MealPlanEntry>('/meal-plan', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const updateMealEntry = (entryId: string, input: MealPlanInput) =>
  apiRequest<MealPlanEntry>(`/meal-plan/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
export const deleteMealEntry = (entryId: string) =>
  apiRequest<{ id: string }>(`/meal-plan/${entryId}`, { method: 'DELETE' });
export const copyMealWeek = (input: {
  sourceWeekStart: string;
  targetWeekStart: string;
  replaceExisting: boolean;
  confirmed: boolean;
}) =>
  apiRequest<{ createdCount: number; skippedCount: number }>(
    '/meal-plan/copy-week',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );

export const getShoppingLists = () =>
  apiRequest<{ items: ShoppingList[] }>('/shopping-lists');
export const createShoppingList = (input: {
  title: string;
  isDefault: boolean;
}) =>
  apiRequest<ShoppingList>('/shopping-lists', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const addShoppingItem = (listId: string, input: ShoppingItemInput) =>
  apiRequest<ShoppingList['items'][number]>(`/shopping-lists/${listId}/items`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const setShoppingItemChecked = (itemId: string, checked: boolean) =>
  apiRequest<ShoppingList['items'][number]>(
    `/shopping-list-items/${itemId}/${checked ? 'check' : 'uncheck'}`,
    { method: 'POST' },
  );
export const generateShoppingPreview = (
  listId: string,
  input: {
    dateFrom: string;
    dateTo: string;
    subtractPantry: boolean;
    includeOptional: boolean;
  },
) =>
  apiRequest<{
    items: {
      key: string;
      text: string;
      quantity: string | null;
      unit: string;
      requiredQuantity: string | null;
      pantryQuantity: string | null;
      pantryNeedsConfirmation: boolean;
    }[];
  }>(`/shopping-lists/${listId}/generate-preview`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const confirmShoppingGeneration = (
  listId: string,
  input: {
    dateFrom: string;
    dateTo: string;
    subtractPantry: boolean;
    includeOptional: boolean;
    confirmed: true;
    excludedKeys: string[];
    pantryConfirmedKeys: string[];
  },
) =>
  apiRequest<{ createdCount: number; skippedCount: number }>(
    `/shopping-lists/${listId}/generate-confirm`,
    { method: 'POST', body: JSON.stringify(input) },
  );

export const getPantry = () => apiRequest<{ items: PantryItem[] }>('/pantry');
export const savePantryItem = (
  itemId: string | null,
  input: {
    ingredientId: string;
    quantity?: string | null;
    unit?: string | null;
    status: string;
    expiresOn?: string | null;
    locationLabel?: string;
    note?: string;
  },
) =>
  apiRequest<PantryItem>(itemId ? `/pantry/${itemId}` : '/pantry', {
    method: itemId ? 'PATCH' : 'POST',
    body: JSON.stringify(input),
  });
export const deletePantryItem = (itemId: string) =>
  apiRequest<{ id: string }>(`/pantry/${itemId}`, { method: 'DELETE' });

export const getMealsDashboard = () =>
  apiRequest<MealsDashboard>('/meals/dashboard');
export const getMealsCalendarSummary = (dateFrom: string, dateTo: string) =>
  apiRequest<{ items: MealPlanEntry[] }>(
    `/meals/calendar-summary?${query({ dateFrom, dateTo })}`,
  );
