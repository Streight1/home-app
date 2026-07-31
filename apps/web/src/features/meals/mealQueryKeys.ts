export const mealKeys = {
  all: ['meals'] as const,
  recipes: () => [...mealKeys.all, 'recipes'] as const,
  recipeList: (filters: unknown) => [...mealKeys.recipes(), filters] as const,
  recipe: (recipeId: string | undefined) =>
    [...mealKeys.all, 'recipe', recipeId] as const,
  ingredients: () => [...mealKeys.all, 'ingredients'] as const,
  ingredientSearch: (search: string) =>
    [...mealKeys.ingredients(), search] as const,
  recipeMetadata: () => [...mealKeys.all, 'recipe-metadata'] as const,
  plan: () => [...mealKeys.all, 'plan'] as const,
  planRange: (dateFrom: string, dateTo: string) =>
    [...mealKeys.plan(), dateFrom, dateTo] as const,
  shopping: () => [...mealKeys.all, 'shopping'] as const,
  shoppingCategories: () => [...mealKeys.all, 'shopping-categories'] as const,
  pantry: () => [...mealKeys.all, 'pantry'] as const,
  dashboard: () => [...mealKeys.all, 'dashboard'] as const,
  calendar: () => [...mealKeys.all, 'calendar'] as const,
  calendarRange: (dateFrom: string, dateTo: string) =>
    [...mealKeys.calendar(), dateFrom, dateTo] as const,
};

export const MEALS_QUERY_KEY = mealKeys.all;
