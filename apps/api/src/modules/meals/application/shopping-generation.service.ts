import { Injectable } from '@nestjs/common';
import type { IngredientUnit } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { mealsInvalid, mealsNotFound } from '../domain/meals.errors.js';
import { dateOnly, MEALS_WRITE_ROLE } from '../domain/meals.types.js';
import type {
  GenerateShoppingConfirmDto,
  GenerateShoppingPreviewDto,
} from '../presentation/dto/shopping.dto.js';
import {
  canMergeMeasurements,
  decimalString,
  mergeMeasurements,
  scaleQuantity,
  subtractMeasurements,
} from '../shared/measurement/decimal-quantity.js';

interface Candidate {
  key: string;
  ingredientId: string;
  text: string;
  quantity: string | null;
  unit: IngredientUnit;
  customUnitLabel: string | null;
  shoppingCategoryId: string | null;
  sources: {
    mealPlanEntryId: string;
    recipeId: string;
    recipeIngredientId: string;
  }[];
}

@Injectable()
export class ShoppingGenerationService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly audit: AuditService,
  ) {}

  public async preview(
    userId: string,
    listId: string,
    input: GenerateShoppingPreviewDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    const list = await this.prisma.shoppingList.findFirst({
      where: {
        id: listId,
        householdId: membership.householdId,
        archivedAt: null,
      },
      select: { id: true, status: true },
    });
    if (!list) throw mealsNotFound();
    if (list.status !== 'OPEN') throw mealsInvalid('Seznam není otevřený.');
    if (input.dateTo < input.dateFrom)
      throw mealsInvalid('Konec období nesmí být před začátkem.');
    const entries = await this.prisma.mealPlanEntry.findMany({
      where: {
        householdId: membership.householdId,
        plannedFor: {
          gte: dateOnly(input.dateFrom),
          lte: dateOnly(input.dateTo),
        },
        ...(input.mealPlanEntryIds?.length
          ? { id: { in: input.mealPlanEntryIds } }
          : {}),
        recipeId: { not: null },
      },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: { ingredient: true },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
    if (
      input.mealPlanEntryIds?.length &&
      entries.length !== new Set(input.mealPlanEntryIds).size
    )
      throw mealsNotFound();
    const linked = await this.prisma.shoppingListItemSource.findMany({
      where: {
        shoppingListItem: { shoppingListId: listId },
        mealPlanEntryId: { in: entries.map(({ id }) => id) },
      },
      select: { mealPlanEntryId: true, recipeIngredientId: true },
    });
    const existing = new Set(
      linked.flatMap((source) =>
        source.mealPlanEntryId && source.recipeIngredientId
          ? [`${source.mealPlanEntryId}:${source.recipeIngredientId}`]
          : [],
      ),
    );
    const candidates: Candidate[] = [];
    for (const entry of entries) {
      if (!entry.recipe) continue;
      for (const item of entry.recipe.ingredients) {
        if (item.isOptional && !input.includeOptional) continue;
        if (existing.has(`${entry.id}:${item.id}`)) continue;
        const candidate: Candidate = {
          key: `${item.ingredientId}:${item.unit}:${item.customUnitLabel ?? ''}`,
          ingredientId: item.ingredientId,
          text: item.ingredient.name,
          quantity:
            item.unit === 'AS_NEEDED'
              ? null
              : scaleQuantity(
                  decimalString(item.quantityDecimal),
                  decimalString(entry.recipe.servings) ?? '1',
                  decimalString(entry.servings) ?? '1',
                ),
          unit: item.unit,
          customUnitLabel: item.customUnitLabel,
          shoppingCategoryId: item.ingredient.shoppingCategoryId,
          sources: [
            {
              mealPlanEntryId: entry.id,
              recipeId: entry.recipe.id,
              recipeIngredientId: item.id,
            },
          ],
        };
        const mergeTarget = candidates.find(
          (current) =>
            current.ingredientId === candidate.ingredientId &&
            canMergeMeasurements(current, candidate),
        );
        if (mergeTarget) {
          const merged = mergeMeasurements(mergeTarget, candidate);
          mergeTarget.quantity = merged.quantity;
          mergeTarget.unit = merged.unit;
          mergeTarget.sources.push(...candidate.sources);
        } else candidates.push(candidate);
      }
    }
    const pantry = input.subtractPantry
      ? await this.prisma.pantryItem.findMany({
          where: {
            householdId: membership.householdId,
            ingredientId: {
              in: candidates.map(({ ingredientId }) => ingredientId),
            },
            status: { in: ['AVAILABLE', 'LOW'] },
          },
        })
      : [];
    return {
      listId,
      period: { dateFrom: input.dateFrom, dateTo: input.dateTo },
      items: candidates.map((candidate) => {
        const available = pantry.find(
          ({ ingredientId }) => ingredientId === candidate.ingredientId,
        );
        if (!available)
          return {
            ...candidate,
            requiredQuantity: candidate.quantity,
            pantryQuantity: null,
            pantryNeedsConfirmation: false,
          };
        if (available.quantityDecimal === null || available.unit === null)
          return {
            ...candidate,
            requiredQuantity: candidate.quantity,
            pantryQuantity: null,
            pantryNeedsConfirmation: true,
          };
        const subtraction = subtractMeasurements(candidate, {
          quantity: decimalString(available.quantityDecimal),
          unit: available.unit,
        });
        return {
          ...candidate,
          requiredQuantity: candidate.quantity,
          quantity: subtraction.remaining.quantity,
          pantryQuantity: decimalString(available.quantityDecimal),
          pantryUnit: available.unit,
          pantryNeedsConfirmation: false,
          pantryCompatible: subtraction.compatible,
        };
      }),
    };
  }

  public async confirm(
    userId: string,
    listId: string,
    input: GenerateShoppingConfirmDto,
  ) {
    if (!input.confirmed)
      throw mealsInvalid('Vytvoření položek vyžaduje potvrzení.');
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    const preview = await this.preview(userId, listId, input);
    const excluded = new Set(input.excludedKeys);
    const pantryConfirmed = new Set(input.pantryConfirmedKeys);
    const included = preview.items.filter(
      (item) =>
        !excluded.has(item.key) &&
        !(item.pantryNeedsConfirmation && pantryConfirmed.has(item.key)) &&
        item.quantity !== '0',
    );
    const createdCount = await this.prisma.$transaction(async (tx) => {
      let count = 0;
      for (const item of included) {
        await tx.shoppingListItem.create({
          data: {
            shoppingListId: listId,
            ingredientId: item.ingredientId,
            text: item.text,
            normalizedText: item.text.trim().toLocaleLowerCase('cs-CZ'),
            quantityDecimal: item.quantity,
            unit: item.unit,
            customUnitLabel: item.customUnitLabel,
            shoppingCategoryId: item.shoppingCategoryId,
            source: 'MEAL_PLAN',
            createdByUserId: userId,
            sources: {
              create: item.sources.map((source) => ({
                ...source,
                shoppingListId: listId,
              })),
            },
          },
        });
        count += 1;
      }
      await this.audit.record(tx, {
        action: 'SHOPPING_ITEMS_GENERATED',
        householdId: membership.householdId,
        userId,
        entityType: 'ShoppingList',
        entityId: listId,
        metadata: {
          createdCount: count,
          sourceEntryCount: new Set(
            included.flatMap(({ sources }) =>
              sources.map(({ mealPlanEntryId }) => mealPlanEntryId),
            ),
          ).size,
        },
      });
      return count;
    });
    return { createdCount, skippedCount: preview.items.length - createdCount };
  }
}
