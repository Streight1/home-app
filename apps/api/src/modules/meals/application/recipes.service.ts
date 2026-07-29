import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { DocumentsFacade } from '../../documents/documents.facade.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { mealsInvalid, mealsNotFound } from '../domain/meals.errors.js';
import {
  MEALS_ADMIN_ROLE,
  MEALS_READ_ROLE,
  MEALS_WRITE_ROLE,
  normalizeCatalogName,
  optionalText,
} from '../domain/meals.types.js';
import type {
  ListRecipesQueryDto,
  RecipeInputDto,
} from '../presentation/dto/recipes.dto.js';
import {
  decimalQuantity,
  scaleQuantity,
} from '../shared/measurement/decimal-quantity.js';
import {
  mapRecipe,
  recipeInclude,
  type RecipeRecord,
} from './meals-response.mapper.js';

@Injectable()
export class RecipesService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly documents: DocumentsFacade,
    private readonly audit: AuditService,
  ) {}

  public async list(userId: string, query: ListRecipesQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_READ_ROLE,
    );
    const where: Prisma.RecipeWhereInput = {
      householdId: membership.householdId,
      archivedAt: query.archived ? { not: null } : null,
      ...(query.query
        ? {
            OR: [
              { title: { contains: query.query, mode: 'insensitive' } },
              { description: { contains: query.query, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.tagId ? { tags: { some: { tagId: query.tagId } } } : {}),
      ...(query.favoriteOnly ? { isFavorite: true } : {}),
      ...(query.maxPreparationMinutes !== undefined
        ? { preparationMinutes: { lte: query.maxPreparationMinutes } }
        : {}),
    };
    const orderBy: Prisma.RecipeOrderByWithRelationInput =
      query.sortBy === 'title'
        ? { normalizedTitle: 'asc' }
        : query.sortBy === 'preparationMinutes'
          ? { preparationMinutes: 'asc' }
          : { [query.sortBy]: 'desc' };
    const [totalItems, items] = await this.prisma.$transaction([
      this.prisma.recipe.count({ where }),
      this.prisma.recipe.findMany({
        where,
        include: recipeInclude,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      items: items.map(mapRecipe),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  public async detail(userId: string, recipeId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_READ_ROLE,
    );
    return mapRecipe(await this.find(membership.householdId, recipeId));
  }

  public async create(userId: string, input: RecipeInputDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    await this.verifyReferences(userId, membership.householdId, input);
    const record = await this.prisma.$transaction(async (tx) => {
      const ingredients = await this.resolveIngredients(
        tx,
        membership.householdId,
        userId,
        input,
      );
      const recipe = await tx.recipe.create({
        data: {
          householdId: membership.householdId,
          ...this.recipeData(input),
          createdByUserId: userId,
          updatedByUserId: userId,
          ingredients: { create: ingredients },
          steps: {
            create: input.steps.map((step, position) => ({
              position,
              title: optionalText(step.title),
              instruction: step.instruction.trim(),
              durationMinutes: step.durationMinutes ?? null,
            })),
          },
          tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
          documents: {
            create: input.documents.map((document) => ({
              documentId: document.documentId,
              relationType: document.relationType,
              isCover: document.isCover,
              createdByUserId: userId,
            })),
          },
        },
        include: recipeInclude,
      });
      await this.audit.record(tx, {
        action: 'RECIPE_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'Recipe',
        entityId: recipe.id,
      });
      return recipe;
    });
    return mapRecipe(record);
  }

  public async update(userId: string, recipeId: string, input: RecipeInputDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    await this.find(membership.householdId, recipeId);
    await this.verifyReferences(userId, membership.householdId, input);
    const record = await this.prisma.$transaction(async (tx) => {
      const ingredients = await this.resolveIngredients(
        tx,
        membership.householdId,
        userId,
        input,
      );
      await tx.recipeIngredient.deleteMany({ where: { recipeId } });
      await tx.recipeStep.deleteMany({ where: { recipeId } });
      await tx.recipeTagLink.deleteMany({ where: { recipeId } });
      await tx.recipeDocument.deleteMany({ where: { recipeId } });
      const recipe = await tx.recipe.update({
        where: { id: recipeId },
        data: {
          ...this.recipeData(input),
          updatedByUserId: userId,
          ingredients: { create: ingredients },
          steps: {
            create: input.steps.map((step, position) => ({
              position,
              title: optionalText(step.title),
              instruction: step.instruction.trim(),
              durationMinutes: step.durationMinutes ?? null,
            })),
          },
          tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
          documents: {
            create: input.documents.map((document) => ({
              documentId: document.documentId,
              relationType: document.relationType,
              isCover: document.isCover,
              createdByUserId: userId,
            })),
          },
        },
        include: recipeInclude,
      });
      await this.audit.record(tx, {
        action: 'RECIPE_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'Recipe',
        entityId: recipeId,
      });
      return recipe;
    });
    return mapRecipe(record);
  }

  public async setArchived(
    userId: string,
    recipeId: string,
    archived: boolean,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_ADMIN_ROLE,
    );
    await this.find(membership.householdId, recipeId);
    const record = await this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.update({
        where: { id: recipeId },
        data: {
          archivedAt: archived ? new Date() : null,
          updatedByUserId: userId,
        },
        include: recipeInclude,
      });
      await this.audit.record(tx, {
        action: archived ? 'RECIPE_ARCHIVED' : 'RECIPE_RESTORED',
        householdId: membership.householdId,
        userId,
        entityType: 'Recipe',
        entityId: recipeId,
      });
      return recipe;
    });
    return mapRecipe(record);
  }

  public async scaled(userId: string, recipeId: string, servings: string) {
    const recipe = await this.detail(userId, recipeId);
    return {
      ...recipe,
      servings,
      ingredients: recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        quantity:
          ingredient.unit === 'AS_NEEDED'
            ? null
            : scaleQuantity(
                ingredient.quantity,
                recipe.servings ?? '1',
                servings,
              ),
      })),
    };
  }

  private recipeData(input: RecipeInputDto) {
    const servings = decimalQuantity(input.servings, 'Počet porcí');
    if (servings.lte(0)) throw mealsInvalid('Počet porcí musí být kladný.');
    return {
      title: input.title.trim(),
      normalizedTitle: normalizeCatalogName(input.title),
      description: optionalText(input.description),
      servings,
      preparationMinutes: input.preparationMinutes ?? null,
      cookingMinutes: input.cookingMinutes ?? null,
      restingMinutes: input.restingMinutes ?? null,
      difficulty: input.difficulty,
      categoryId: input.categoryId ?? null,
      sourceLabel: optionalText(input.sourceLabel),
      sourceUrl: optionalText(input.sourceUrl),
      notes: optionalText(input.notes),
      isFavorite: input.isFavorite,
    };
  }

  private async verifyReferences(
    userId: string,
    householdId: string,
    input: RecipeInputDto,
  ) {
    if (input.categoryId) {
      const count = await this.prisma.recipeCategory.count({
        where: { id: input.categoryId, householdId, archivedAt: null },
      });
      if (count !== 1) throw mealsNotFound();
    }
    if (input.tagIds.length) {
      const count = await this.prisma.recipeTag.count({
        where: {
          id: { in: [...new Set(input.tagIds)] },
          householdId,
          archivedAt: null,
        },
      });
      if (count !== new Set(input.tagIds).size) throw mealsNotFound();
    }
    await this.documents.verifyAccessibleSummaries(
      userId,
      input.documents.map(({ documentId }) => documentId),
    );
    if (input.documents.filter(({ isCover }) => isCover).length > 1)
      throw mealsInvalid('Recept může mít jen jednu titulní fotografii.');
  }

  private async resolveIngredients(
    tx: Prisma.TransactionClient,
    householdId: string,
    userId: string,
    input: RecipeInputDto,
  ) {
    const result: Prisma.RecipeIngredientCreateWithoutRecipeInput[] = [];
    for (const [position, item] of input.ingredients.entries()) {
      if (!item.ingredientId && !item.ingredientName)
        throw mealsInvalid('Vyberte nebo pojmenujte surovinu.');
      let ingredientId = item.ingredientId;
      if (ingredientId) {
        const ingredient = await tx.ingredient.findFirst({
          where: { id: ingredientId, householdId, archivedAt: null },
          select: { id: true },
        });
        if (!ingredient) throw mealsNotFound();
      } else {
        const name = item.ingredientName?.trim() ?? '';
        const ingredient = await tx.ingredient.upsert({
          where: {
            householdId_normalizedName: {
              householdId,
              normalizedName: normalizeCatalogName(name),
            },
          },
          update: { archivedAt: null },
          create: {
            householdId,
            name,
            normalizedName: normalizeCatalogName(name),
            defaultUnit: item.unit,
            createdByUserId: userId,
          },
        });
        ingredientId = ingredient.id;
      }
      if (item.unit === 'CUSTOM' && !item.customUnitLabel)
        throw mealsInvalid('Vlastní jednotka vyžaduje název.');
      const quantity =
        item.unit === 'AS_NEEDED' ||
        item.quantity === null ||
        item.quantity === undefined
          ? null
          : decimalQuantity(item.quantity);
      result.push({
        ingredient: { connect: { id: ingredientId } },
        position,
        quantityDecimal: quantity,
        unit: item.unit,
        customUnitLabel: optionalText(item.customUnitLabel),
        preparationNote: optionalText(item.preparationNote),
        isOptional: item.isOptional,
        groupLabel: optionalText(item.groupLabel),
      });
    }
    return result;
  }

  private async find(
    householdId: string,
    recipeId: string,
  ): Promise<RecipeRecord> {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id: recipeId, householdId },
      include: recipeInclude,
    });
    if (!recipe) throw mealsNotFound();
    return recipe;
  }
}
