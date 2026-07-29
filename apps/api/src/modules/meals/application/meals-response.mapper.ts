import type { Prisma } from '../../../generated/prisma/client.js';
import { dateOnlyString } from '../domain/meals.types.js';
import { decimalString } from '../shared/measurement/decimal-quantity.js';

export const recipeInclude = {
  category: true,
  ingredients: {
    orderBy: { position: 'asc' as const },
    include: { ingredient: true },
  },
  steps: { orderBy: { position: 'asc' as const } },
  tags: { include: { tag: true } },
  documents: true,
} satisfies Prisma.RecipeInclude;

export type RecipeRecord = Prisma.RecipeGetPayload<{
  include: typeof recipeInclude;
}>;

export const mapRecipe = (recipe: RecipeRecord) => ({
  id: recipe.id,
  title: recipe.title,
  description: recipe.description,
  servings: decimalString(recipe.servings),
  preparationMinutes: recipe.preparationMinutes,
  cookingMinutes: recipe.cookingMinutes,
  restingMinutes: recipe.restingMinutes,
  difficulty: recipe.difficulty,
  category: recipe.category
    ? { id: recipe.category.id, name: recipe.category.name }
    : null,
  sourceLabel: recipe.sourceLabel,
  sourceUrl: recipe.sourceUrl,
  notes: recipe.notes,
  isFavorite: recipe.isFavorite,
  archived: recipe.archivedAt !== null,
  ingredients: recipe.ingredients.map((item) => ({
    id: item.id,
    ingredientId: item.ingredientId,
    name: item.ingredient.name,
    quantity: decimalString(item.quantityDecimal),
    unit: item.unit,
    customUnitLabel: item.customUnitLabel,
    preparationNote: item.preparationNote,
    isOptional: item.isOptional,
    groupLabel: item.groupLabel,
    position: item.position,
  })),
  steps: recipe.steps.map((step) => ({
    id: step.id,
    title: step.title,
    instruction: step.instruction,
    durationMinutes: step.durationMinutes,
    position: step.position,
  })),
  tags: recipe.tags.map(({ tag }) => ({ id: tag.id, name: tag.name })),
  documents: recipe.documents.map((document) => ({
    documentId: document.documentId,
    relationType: document.relationType,
    isCover: document.isCover,
  })),
  createdAt: recipe.createdAt.toISOString(),
  updatedAt: recipe.updatedAt.toISOString(),
});

export const mealEntryInclude = {
  recipe: { select: { id: true, title: true, archivedAt: true } },
  participants: {
    include: {
      user: {
        select: { id: true, displayName: true, email: true, avatarUrl: true },
      },
    },
  },
} satisfies Prisma.MealPlanEntryInclude;

export type MealEntryRecord = Prisma.MealPlanEntryGetPayload<{
  include: typeof mealEntryInclude;
}>;

export const mapMealEntry = (entry: MealEntryRecord) => ({
  id: entry.id,
  plannedFor: dateOnlyString(entry.plannedFor),
  mealType: entry.mealType,
  customMealTypeLabel: entry.customMealTypeLabel,
  recipe: entry.recipe
    ? {
        id: entry.recipe.id,
        title: entry.recipe.title,
        archived: entry.recipe.archivedAt !== null,
      }
    : null,
  title: entry.title,
  servings: decimalString(entry.servings),
  notes: entry.notes,
  participants: entry.participants.map(({ user }) => ({
    id: user.id,
    displayName: user.displayName ?? user.email,
    avatarUrl: user.avatarUrl,
  })),
  createdAt: entry.createdAt.toISOString(),
  updatedAt: entry.updatedAt.toISOString(),
});
