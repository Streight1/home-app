import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  MEALS_ADMIN_ROLE,
  MEALS_READ_ROLE,
  normalizeCatalogName,
} from '../domain/meals.types.js';
import type { CreateCatalogCategoryDto } from '../presentation/dto/shopping.dto.js';

const RECIPE_CATEGORIES = [
  'Snídaně',
  'Polévky',
  'Hlavní jídla',
  'Těstoviny',
  'Saláty',
  'Dezerty',
  'Pečení',
  'Nápoje',
  'Svačiny',
  'Ostatní',
] as const;

const SHOPPING_CATEGORIES = [
  'Ovoce a zelenina',
  'Pečivo',
  'Maso a ryby',
  'Mléčné výrobky',
  'Trvanlivé potraviny',
  'Mražené',
  'Nápoje',
  'Drogerie',
  'Domácnost',
  'Ostatní',
] as const;

@Injectable()
export class MealsCatalogService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
  ) {}

  public async ingredients(userId: string, query?: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_READ_ROLE,
    );
    const items = await this.prisma.ingredient.findMany({
      where: {
        householdId: membership.householdId,
        archivedAt: null,
        ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        name: true,
        defaultUnit: true,
        shoppingCategoryId: true,
      },
      orderBy: { normalizedName: 'asc' },
      take: 100,
    });
    return { items };
  }

  public async recipeCategories(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_READ_ROLE,
    );
    const [categories, tags] = await this.prisma.$transaction([
      this.prisma.recipeCategory.findMany({
        where: { householdId: membership.householdId, archivedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { normalizedName: 'asc' }],
      }),
      this.prisma.recipeTag.findMany({
        where: { householdId: membership.householdId, archivedAt: null },
        orderBy: { normalizedName: 'asc' },
      }),
    ]);
    return {
      items: categories.map(({ id, name, iconKey, colorToken }) => ({
        id,
        name,
        iconKey,
        colorToken,
      })),
      tags: tags.map(({ id, name }) => ({ id, name })),
    };
  }

  public async shoppingCategories(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_READ_ROLE,
    );
    const items = await this.prisma.shoppingCategory.findMany({
      where: { householdId: membership.householdId, archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { normalizedName: 'asc' }],
    });
    return {
      items: items.map(({ id, name, iconKey, colorToken, sortOrder }) => ({
        id,
        name,
        iconKey,
        colorToken,
        sortOrder,
      })),
    };
  }

  public async createRecipeCategory(
    userId: string,
    input: CreateCatalogCategoryDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_ADMIN_ROLE,
    );
    return this.prisma.recipeCategory.create({
      data: {
        householdId: membership.householdId,
        name: input.name.trim(),
        normalizedName: normalizeCatalogName(input.name),
        iconKey: input.iconKey,
        colorToken: input.colorToken,
        sortOrder: input.sortOrder,
        createdByUserId: userId,
      },
    });
  }

  public async createShoppingCategory(
    userId: string,
    input: CreateCatalogCategoryDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_ADMIN_ROLE,
    );
    return this.prisma.shoppingCategory.create({
      data: {
        householdId: membership.householdId,
        name: input.name.trim(),
        normalizedName: normalizeCatalogName(input.name),
        iconKey: input.iconKey,
        colorToken: input.colorToken,
        sortOrder: input.sortOrder,
        createdByUserId: userId,
      },
    });
  }

  public async recommended(userId: string, kind: 'recipe' | 'shopping') {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_ADMIN_ROLE,
    );
    const names = kind === 'recipe' ? RECIPE_CATEGORIES : SHOPPING_CATEGORIES;
    let createdCount = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const [sortOrder, name] of names.entries()) {
        if (kind === 'recipe') {
          const existing = await tx.recipeCategory.findUnique({
            where: {
              householdId_normalizedName: {
                householdId: membership.householdId,
                normalizedName: normalizeCatalogName(name),
              },
            },
          });
          await tx.recipeCategory.upsert({
            where: {
              householdId_normalizedName: {
                householdId: membership.householdId,
                normalizedName: normalizeCatalogName(name),
              },
            },
            update: { archivedAt: null },
            create: {
              householdId: membership.householdId,
              name,
              normalizedName: normalizeCatalogName(name),
              sortOrder,
              createdByUserId: userId,
            },
          });
          if (!existing) createdCount += 1;
        } else {
          const existing = await tx.shoppingCategory.findUnique({
            where: {
              householdId_normalizedName: {
                householdId: membership.householdId,
                normalizedName: normalizeCatalogName(name),
              },
            },
          });
          await tx.shoppingCategory.upsert({
            where: {
              householdId_normalizedName: {
                householdId: membership.householdId,
                normalizedName: normalizeCatalogName(name),
              },
            },
            update: { archivedAt: null },
            create: {
              householdId: membership.householdId,
              name,
              normalizedName: normalizeCatalogName(name),
              sortOrder,
              createdByUserId: userId,
            },
          });
          if (!existing) createdCount += 1;
        }
      }
    });
    return { createdCount };
  }
}
