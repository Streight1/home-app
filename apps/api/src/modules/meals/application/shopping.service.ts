import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { mealsNotFound } from '../domain/meals.errors.js';
import {
  MEALS_ADMIN_ROLE,
  MEALS_READ_ROLE,
  MEALS_WRITE_ROLE,
  normalizeCatalogName,
  optionalText,
} from '../domain/meals.types.js';
import type {
  CreateShoppingListDto,
  ShoppingItemInputDto,
  UpdateShoppingListDto,
} from '../presentation/dto/shopping.dto.js';
import {
  decimalQuantity,
  decimalString,
} from '../shared/measurement/decimal-quantity.js';

const listInclude = {
  items: {
    orderBy: [{ checkedAt: 'asc' as const }, { sortOrder: 'asc' as const }],
    include: {
      ingredient: { select: { id: true, name: true } },
      shoppingCategory: { select: { id: true, name: true, sortOrder: true } },
      sources: true,
    },
  },
} satisfies Prisma.ShoppingListInclude;

type ListRecord = Prisma.ShoppingListGetPayload<{
  include: typeof listInclude;
}>;

const mapItem = (item: ListRecord['items'][number]) => ({
  id: item.id,
  ingredient: item.ingredient,
  text: item.text,
  quantity: decimalString(item.quantityDecimal),
  unit: item.unit,
  customUnitLabel: item.customUnitLabel,
  category: item.shoppingCategory,
  note: item.note,
  source: item.source,
  checked: item.checkedAt !== null,
  checkedAt: item.checkedAt?.toISOString() ?? null,
  sortOrder: item.sortOrder,
  generatedSourceCount: item.sources.length,
});

const mapList = (list: ListRecord) => ({
  id: list.id,
  title: list.title,
  status: list.status,
  isDefault: list.isDefault,
  archived: list.archivedAt !== null,
  items: list.items.map(mapItem),
  openItemCount: list.items.filter(({ checkedAt }) => checkedAt === null)
    .length,
  createdAt: list.createdAt.toISOString(),
  updatedAt: list.updatedAt.toISOString(),
});

@Injectable()
export class ShoppingService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly audit: AuditService,
  ) {}

  public async list(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_READ_ROLE,
    );
    const lists = await this.prisma.shoppingList.findMany({
      where: { householdId: membership.householdId, archivedAt: null },
      include: listInclude,
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    return { items: lists.map(mapList) };
  }

  public async detail(userId: string, listId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_READ_ROLE,
    );
    return mapList(await this.find(membership.householdId, listId));
  }

  public async create(userId: string, input: CreateShoppingListDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    const list = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault)
        await tx.shoppingList.updateMany({
          where: { householdId: membership.householdId, isDefault: true },
          data: { isDefault: false },
        });
      const created = await tx.shoppingList.create({
        data: {
          householdId: membership.householdId,
          title: input.title.trim(),
          isDefault: input.isDefault,
          createdByUserId: userId,
        },
        include: listInclude,
      });
      await this.audit.record(tx, {
        action: 'SHOPPING_LIST_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'ShoppingList',
        entityId: created.id,
      });
      return created;
    });
    return mapList(list);
  }

  public async update(
    userId: string,
    listId: string,
    input: UpdateShoppingListDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    await this.find(membership.householdId, listId);
    const list = await this.prisma.$transaction(async (tx) => {
      if (input.isDefault)
        await tx.shoppingList.updateMany({
          where: {
            householdId: membership.householdId,
            isDefault: true,
            id: { not: listId },
          },
          data: { isDefault: false },
        });
      return tx.shoppingList.update({
        where: { id: listId },
        data: { title: input.title.trim(), isDefault: input.isDefault },
        include: listInclude,
      });
    });
    return mapList(list);
  }

  public async complete(userId: string, listId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_ADMIN_ROLE,
    );
    await this.find(membership.householdId, listId);
    const list = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.shoppingList.update({
        where: { id: listId },
        data: { status: 'COMPLETED', isDefault: false },
        include: listInclude,
      });
      await this.audit.record(tx, {
        action: 'SHOPPING_LIST_COMPLETED',
        householdId: membership.householdId,
        userId,
        entityType: 'ShoppingList',
        entityId: listId,
      });
      return updated;
    });
    return mapList(list);
  }

  public async addItem(
    userId: string,
    listId: string,
    input: ShoppingItemInputDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    await this.find(membership.householdId, listId);
    await this.verifyItemReferences(membership.householdId, input);
    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shoppingListItem.create({
        data: {
          shoppingListId: listId,
          ...this.itemData(input),
          source: 'MANUAL',
          createdByUserId: userId,
        },
        include: {
          ingredient: { select: { id: true, name: true } },
          shoppingCategory: {
            select: { id: true, name: true, sortOrder: true },
          },
          sources: true,
        },
      });
      await this.audit.record(tx, {
        action: 'SHOPPING_ITEM_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'ShoppingListItem',
        entityId: created.id,
      });
      return created;
    });
    return mapItem(item);
  }

  public async updateItem(
    userId: string,
    itemId: string,
    input: ShoppingItemInputDto,
  ) {
    const context = await this.itemContext(userId, itemId, MEALS_WRITE_ROLE);
    await this.verifyItemReferences(context.householdId, input);
    const item = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.shoppingListItem.update({
        where: { id: itemId },
        data: this.itemData(input),
        include: {
          ingredient: { select: { id: true, name: true } },
          shoppingCategory: {
            select: { id: true, name: true, sortOrder: true },
          },
          sources: true,
        },
      });
      await this.audit.record(tx, {
        action: 'SHOPPING_ITEM_UPDATED',
        householdId: context.householdId,
        userId,
        entityType: 'ShoppingListItem',
        entityId: itemId,
      });
      return updated;
    });
    return mapItem(item);
  }

  public async setChecked(userId: string, itemId: string, checked: boolean) {
    const context = await this.itemContext(userId, itemId, MEALS_WRITE_ROLE);
    const item = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.shoppingListItem.update({
        where: { id: itemId },
        data: {
          checkedAt: checked ? new Date() : null,
          checkedByUserId: checked ? userId : null,
        },
        include: {
          ingredient: { select: { id: true, name: true } },
          shoppingCategory: {
            select: { id: true, name: true, sortOrder: true },
          },
          sources: true,
        },
      });
      await this.audit.record(tx, {
        action: checked ? 'SHOPPING_ITEM_CHECKED' : 'SHOPPING_ITEM_UNCHECKED',
        householdId: context.householdId,
        userId,
        entityType: 'ShoppingListItem',
        entityId: itemId,
      });
      return updated;
    });
    return mapItem(item);
  }

  public async removeItem(userId: string, itemId: string) {
    const context = await this.itemContext(userId, itemId, MEALS_WRITE_ROLE);
    await this.prisma.$transaction(async (tx) => {
      await tx.shoppingListItem.delete({ where: { id: itemId } });
      await this.audit.record(tx, {
        action: 'SHOPPING_ITEM_UPDATED',
        householdId: context.householdId,
        userId,
        entityType: 'ShoppingListItem',
        entityId: itemId,
        metadata: { removed: true },
      });
    });
    return { id: itemId };
  }

  private itemData(input: ShoppingItemInputDto) {
    return {
      ingredientId: input.ingredientId ?? null,
      text: input.text.trim(),
      normalizedText: normalizeCatalogName(input.text),
      quantityDecimal: input.quantity ? decimalQuantity(input.quantity) : null,
      unit: input.unit ?? null,
      customUnitLabel: optionalText(input.customUnitLabel),
      shoppingCategoryId: input.shoppingCategoryId ?? null,
      note: optionalText(input.note),
      sortOrder: input.sortOrder,
    };
  }

  private async verifyItemReferences(
    householdId: string,
    input: ShoppingItemInputDto,
  ) {
    if (input.ingredientId) {
      const found = await this.prisma.ingredient.count({
        where: { id: input.ingredientId, householdId },
      });
      if (!found) throw mealsNotFound();
    }
    if (input.shoppingCategoryId) {
      const found = await this.prisma.shoppingCategory.count({
        where: { id: input.shoppingCategoryId, householdId, archivedAt: null },
      });
      if (!found) throw mealsNotFound();
    }
  }

  private async itemContext(userId: string, itemId: string, role: 'MEMBER') {
    const membership = await this.access.getActiveMembership(userId, role);
    const item = await this.prisma.shoppingListItem.findFirst({
      where: {
        id: itemId,
        shoppingList: { householdId: membership.householdId },
      },
      select: { id: true },
    });
    if (!item) throw mealsNotFound();
    return { householdId: membership.householdId };
  }

  private async find(householdId: string, listId: string): Promise<ListRecord> {
    const list = await this.prisma.shoppingList.findFirst({
      where: { id: listId, householdId },
      include: listInclude,
    });
    if (!list) throw mealsNotFound();
    return list;
  }
}
