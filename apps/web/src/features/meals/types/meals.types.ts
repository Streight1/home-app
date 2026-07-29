export type IngredientUnit =
  | 'G'
  | 'KG'
  | 'ML'
  | 'L'
  | 'TSP'
  | 'TBSP'
  | 'CUP'
  | 'PIECE'
  | 'PACKAGE'
  | 'SLICE'
  | 'PINCH'
  | 'AS_NEEDED'
  | 'CUSTOM';

export type MealType =
  | 'BREAKFAST'
  | 'MORNING_SNACK'
  | 'LUNCH'
  | 'AFTERNOON_SNACK'
  | 'DINNER'
  | 'OTHER';

export interface IngredientSummary {
  id: string;
  name: string;
  defaultUnit: IngredientUnit | null;
  shoppingCategoryId: string | null;
}

export interface RecipeIngredientInput {
  ingredientId?: string | undefined;
  ingredientName?: string | undefined;
  quantity: string | null;
  unit: IngredientUnit;
  customUnitLabel?: string | undefined;
  preparationNote?: string | undefined;
  isOptional: boolean;
  groupLabel?: string | undefined;
}

export interface RecipeInput {
  title: string;
  description?: string;
  servings: string;
  preparationMinutes?: number | undefined;
  cookingMinutes?: number | undefined;
  restingMinutes?: number | undefined;
  difficulty: 'EASY' | 'MEDIUM' | 'ADVANCED' | 'UNSPECIFIED';
  categoryId?: string | null;
  sourceLabel?: string;
  sourceUrl?: string;
  notes?: string;
  isFavorite: boolean;
  tagIds: string[];
  ingredients: RecipeIngredientInput[];
  steps: {
    title?: string | undefined;
    instruction: string;
    durationMinutes?: number | undefined;
  }[];
  documents: {
    documentId: string;
    relationType: 'PHOTO' | 'SOURCE' | 'PRINTED_RECIPE' | 'OTHER';
    isCover: boolean;
  }[];
}

export interface Recipe extends Omit<
  RecipeInput,
  'categoryId' | 'tagIds' | 'ingredients' | 'steps' | 'documents'
> {
  id: string;
  category: { id: string; name: string } | null;
  tags: { id: string; name: string }[];
  archived: boolean;
  ingredients: (RecipeIngredientInput & {
    id: string;
    ingredientId: string;
    name: string;
    position: number;
  })[];
  steps: {
    id: string;
    title: string | null;
    instruction: string;
    durationMinutes: number | null;
    position: number;
  }[];
  documents: RecipeInput['documents'];
  createdAt: string;
  updatedAt: string;
}

export interface MealParticipant {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  colorToken?: string;
}

export interface MealPlanInput {
  plannedFor: string;
  mealType: MealType;
  customMealTypeLabel?: string;
  recipeId?: string | null;
  title: string;
  servings: string;
  notes?: string;
  participantUserIds: string[];
}

export interface MealPlanEntry {
  id: string;
  plannedFor: string;
  mealType: MealType;
  customMealTypeLabel: string | null;
  recipe: { id: string; title: string; archived: boolean } | null;
  title: string;
  servings: string;
  notes: string | null;
  participants: MealParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  ingredient: { id: string; name: string } | null;
  text: string;
  quantity: string | null;
  unit: IngredientUnit | null;
  customUnitLabel: string | null;
  category: { id: string; name: string; sortOrder: number } | null;
  note: string | null;
  source: 'MANUAL' | 'RECIPE' | 'MEAL_PLAN' | 'PANTRY_LOW_STOCK';
  checked: boolean;
  checkedAt: string | null;
  sortOrder: number;
  generatedSourceCount: number;
}

export interface ShoppingList {
  id: string;
  title: string;
  status: 'OPEN' | 'COMPLETED' | 'ARCHIVED';
  isDefault: boolean;
  archived: boolean;
  items: ShoppingListItem[];
  openItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItemInput {
  ingredientId?: string | null;
  text: string;
  quantity?: string | null;
  unit?: IngredientUnit | null;
  customUnitLabel?: string;
  shoppingCategoryId?: string | null;
  note?: string;
  sortOrder?: number;
}

export interface PantryItem {
  id: string;
  ingredient: { id: string; name: string };
  quantity: string | null;
  unit: IngredientUnit | null;
  status: 'AVAILABLE' | 'LOW' | 'OUT' | 'UNKNOWN';
  expiresOn: string | null;
  locationLabel: string | null;
  note: string | null;
  updatedAt: string;
}

export interface MealsDashboard {
  today: string;
  todayMeals: {
    id: string;
    plannedFor: string;
    mealType: MealType;
    title: string;
    servings: string;
  }[];
  tomorrowMeal: {
    id: string;
    plannedFor: string;
    mealType: MealType;
    title: string;
    servings: string;
  } | null;
  shoppingList: { id: string; title: string; openItemCount: number } | null;
}
