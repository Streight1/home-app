import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import {
  compactSearchFields,
  searchField,
  searchLikePattern,
  type ApplicationSearchProvider,
  type ModuleSearchCandidate,
  type ModuleSearchRequest,
  type SearchContext,
  type SearchEntityType,
} from '../../../common/search/application-search-provider.js';
import { serializeDateOnly } from '../../../common/time/date-only.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

interface RecipeSearchRow {
  id: string;
  title: string;
  description: string | null;
  categoryName: string | null;
  tagNames: string | null;
  ingredientNames: string | null;
  updatedAt: Date;
}
interface MealSearchRow {
  id: string;
  title: string;
  recipeTitle: string | null;
  mealType: string;
  plannedFor: Date;
  updatedAt: Date;
}
interface ShoppingSearchRow {
  id: string;
  title: string;
  matchedItem: string | null;
  updatedAt: Date;
}
interface PantrySearchRow {
  id: string;
  ingredientName: string;
  locationLabel: string | null;
  status: string;
  updatedAt: Date;
}

@Injectable()
export class MealsSearchProvider implements ApplicationSearchProvider {
  public readonly providerKey = 'meals' as const;
  public readonly supportedTypes = [
    'recipes',
    'meal-plan',
    'shopping',
    'pantry',
  ] as const;

  public constructor(private readonly prisma: PrismaService) {}

  public async search(
    context: SearchContext,
    request: ModuleSearchRequest,
  ): Promise<ModuleSearchCandidate[]> {
    const pattern = searchLikePattern(request.normalizedQuery);
    const wants = (type: SearchEntityType) =>
      request.requestedTypes.size === 0 || request.requestedTypes.has(type);

    const [recipes, mealPlan, shopping, pantry] = await Promise.all([
      wants('recipes')
        ? this.searchRecipes(context, request, pattern)
        : Promise.resolve([]),
      wants('meal-plan')
        ? this.searchMealPlan(context, request, pattern)
        : Promise.resolve([]),
      wants('shopping')
        ? this.searchShopping(context, request, pattern)
        : Promise.resolve([]),
      wants('pantry')
        ? this.searchPantry(context, request, pattern)
        : Promise.resolve([]),
    ]);
    return [...recipes, ...mealPlan, ...shopping, ...pantry];
  }

  private async searchRecipes(
    context: SearchContext,
    request: ModuleSearchRequest,
    pattern: string,
  ): Promise<ModuleSearchCandidate[]> {
    const rows = await this.prisma.$queryRaw<RecipeSearchRow[]>(Prisma.sql`
      SELECT r."id", r."title", r."description", c."name" AS "categoryName",
        tags."names" AS "tagNames", ingredients."names" AS "ingredientNames", r."updatedAt"
      FROM "Recipe" r
      LEFT JOIN "RecipeCategory" c ON c."id" = r."categoryId"
      LEFT JOIN LATERAL (
        SELECT string_agg(t."name", ', ') AS "names"
        FROM "RecipeTagLink" l JOIN "RecipeTag" t ON t."id" = l."tagId"
        WHERE l."recipeId" = r."id"
      ) tags ON true
      LEFT JOIN LATERAL (
        SELECT string_agg(i."name", ', ') AS "names"
        FROM "RecipeIngredient" ri JOIN "Ingredient" i ON i."id" = ri."ingredientId"
        WHERE ri."recipeId" = r."id"
      ) ingredients ON true
      WHERE r."householdId" = ${context.householdId}::uuid
        AND r."archivedAt" IS NULL
        AND (
          homeapp_search_normalize(r."title") LIKE ${pattern}
          OR homeapp_search_normalize(r."description") LIKE ${pattern}
          OR homeapp_search_normalize(c."name") LIKE ${pattern}
          OR homeapp_search_normalize(tags."names") LIKE ${pattern}
          OR homeapp_search_normalize(ingredients."names") LIKE ${pattern}
        )
      ORDER BY r."updatedAt" DESC
      LIMIT ${request.limitPerType * 4}
    `);
    return rows.map((row) => ({
      providerKey: this.providerKey,
      entityId: row.id,
      entityKind: 'RECIPE',
      entityType: 'recipes',
      groupKey: 'meals',
      title: row.title,
      subtitle: row.categoryName ?? 'Recept',
      iconKey: 'recipe',
      fields: compactSearchFields([
        searchField('title', 'Název', row.title, 0.84),
        searchField('description', 'Popis', row.description, 0.66, true),
        searchField('category', 'Kategorie', row.categoryName, 0.72),
        searchField('tags', 'Tagy', row.tagNames, 0.68),
        searchField('ingredients', 'Obsahuje', row.ingredientNames, 0.74),
      ]),
      navigationTarget: { area: 'meals', screen: 'recipe', recipeId: row.id },
      updatedAt: row.updatedAt,
    }));
  }

  private async searchMealPlan(
    context: SearchContext,
    request: ModuleSearchRequest,
    pattern: string,
  ): Promise<ModuleSearchCandidate[]> {
    const rows = await this.prisma.$queryRaw<MealSearchRow[]>(Prisma.sql`
      SELECT e."id", e."title", r."title" AS "recipeTitle", e."mealType"::text AS "mealType",
        e."plannedFor", e."updatedAt"
      FROM "MealPlanEntry" e LEFT JOIN "Recipe" r ON r."id" = e."recipeId"
      WHERE e."householdId" = ${context.householdId}::uuid
        AND (
          homeapp_search_normalize(e."title") LIKE ${pattern}
          OR homeapp_search_normalize(r."title") LIKE ${pattern}
          OR homeapp_search_normalize(e."mealType"::text) LIKE ${pattern}
          OR to_char(e."plannedFor", 'YYYY-MM-DD') = ${request.normalizedQuery}
        )
      ORDER BY e."plannedFor" DESC
      LIMIT ${request.limitPerType * 4}
    `);
    return rows.map((row) => ({
      providerKey: this.providerKey,
      entityId: row.id,
      entityKind: 'MEAL_PLAN_ENTRY',
      entityType: 'meal-plan',
      groupKey: 'meals',
      title: row.title,
      subtitle: row.recipeTitle ?? row.mealType,
      iconKey: 'meal-plan',
      dateLabel: serializeDateOnly(row.plannedFor),
      fields: compactSearchFields([
        searchField('title', 'Jídlo', row.title, 0.84),
        searchField('recipe', 'Recept', row.recipeTitle, 0.78),
        searchField('meal-type', 'Typ jídla', row.mealType, 0.68),
        searchField('date', 'Datum', serializeDateOnly(row.plannedFor), 0.7),
      ]),
      navigationTarget: { area: 'meals', screen: 'planner' },
      updatedAt: row.updatedAt,
    }));
  }

  private async searchShopping(
    context: SearchContext,
    request: ModuleSearchRequest,
    pattern: string,
  ): Promise<ModuleSearchCandidate[]> {
    const rows = await this.prisma.$queryRaw<ShoppingSearchRow[]>(Prisma.sql`
      SELECT l."id", l."title", matched."text" AS "matchedItem", l."updatedAt"
      FROM "ShoppingList" l
      LEFT JOIN LATERAL (
        SELECT i."text" FROM "ShoppingListItem" i
        WHERE i."shoppingListId" = l."id" AND i."checkedAt" IS NULL
          AND homeapp_search_normalize(i."text") LIKE ${pattern}
        ORDER BY i."sortOrder" ASC LIMIT 1
      ) matched ON true
      WHERE l."householdId" = ${context.householdId}::uuid
        AND l."archivedAt" IS NULL
        AND (
          homeapp_search_normalize(l."title") LIKE ${pattern}
          OR matched."text" IS NOT NULL
        )
      ORDER BY l."updatedAt" DESC
      LIMIT ${request.limitPerType * 4}
    `);
    return rows.map((row) => ({
      providerKey: this.providerKey,
      entityId: row.id,
      entityKind: 'SHOPPING_LIST',
      entityType: 'shopping',
      groupKey: 'meals',
      title: row.title,
      subtitle: 'Nákupní seznam',
      iconKey: 'shopping-basket',
      fields: compactSearchFields([
        searchField('title', 'Název seznamu', row.title, 0.84),
        searchField('item', 'Otevřená položka', row.matchedItem, 0.74),
      ]),
      navigationTarget: { area: 'meals', screen: 'shopping' },
      updatedAt: row.updatedAt,
    }));
  }

  private async searchPantry(
    context: SearchContext,
    request: ModuleSearchRequest,
    pattern: string,
  ): Promise<ModuleSearchCandidate[]> {
    const rows = await this.prisma.$queryRaw<PantrySearchRow[]>(Prisma.sql`
      SELECT p."id", i."name" AS "ingredientName", p."locationLabel",
        p."status"::text AS "status", p."updatedAt"
      FROM "PantryItem" p JOIN "Ingredient" i ON i."id" = p."ingredientId"
      WHERE p."householdId" = ${context.householdId}::uuid
        AND (
          homeapp_search_normalize(i."name") LIKE ${pattern}
          OR homeapp_search_normalize(p."locationLabel") LIKE ${pattern}
          OR homeapp_search_normalize(p."status"::text) LIKE ${pattern}
        )
      ORDER BY p."updatedAt" DESC
      LIMIT ${request.limitPerType * 4}
    `);
    return rows.map((row) => ({
      providerKey: this.providerKey,
      entityId: row.id,
      entityKind: 'PANTRY_ITEM',
      entityType: 'pantry',
      groupKey: 'meals',
      title: row.ingredientName,
      subtitle: row.locationLabel ?? 'Zásoby',
      iconKey: 'pantry',
      badges: [{ label: row.status }],
      fields: compactSearchFields([
        searchField('title', 'Surovina', row.ingredientName, 0.84),
        searchField('location', 'Umístění', row.locationLabel, 0.7),
        searchField('status', 'Stav', row.status, 0.68),
      ]),
      navigationTarget: { area: 'meals', screen: 'pantry' },
      updatedAt: row.updatedAt,
    }));
  }
}
