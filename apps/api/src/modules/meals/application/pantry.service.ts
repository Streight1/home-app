import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { mealsNotFound } from '../domain/meals.errors.js';
import {
  dateOnly,
  dateOnlyString,
  MEALS_READ_ROLE,
  MEALS_WRITE_ROLE,
  optionalText,
} from '../domain/meals.types.js';
import type { PantryItemInputDto } from '../presentation/dto/pantry.dto.js';
import {
  decimalQuantity,
  decimalString,
} from '../shared/measurement/decimal-quantity.js';

const pantryInclude = { ingredient: true } as const;

const mapPantry = (item: {
  id: string;
  quantityDecimal: { toFixed(value: number): string } | null;
  unit: string | null;
  status: string;
  expiresOn: Date | null;
  locationLabel: string | null;
  note: string | null;
  ingredient: { id: string; name: string };
  updatedAt: Date;
}) => ({
  id: item.id,
  ingredient: item.ingredient,
  quantity: item.quantityDecimal
    ? decimalString(item.quantityDecimal as never)
    : null,
  unit: item.unit,
  status: item.status,
  expiresOn: item.expiresOn ? dateOnlyString(item.expiresOn) : null,
  locationLabel: item.locationLabel,
  note: item.note,
  updatedAt: item.updatedAt.toISOString(),
});

@Injectable()
export class PantryService {
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
    const items = await this.prisma.pantryItem.findMany({
      where: { householdId: membership.householdId },
      include: pantryInclude,
      orderBy: [{ status: 'asc' }, { ingredient: { normalizedName: 'asc' } }],
    });
    return { items: items.map(mapPantry) };
  }

  public async create(userId: string, input: PantryItemInputDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    await this.verifyIngredient(membership.householdId, input.ingredientId);
    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.pantryItem.create({
        data: {
          householdId: membership.householdId,
          ...this.data(input),
          updatedByUserId: userId,
        },
        include: pantryInclude,
      });
      await this.audit.record(tx, {
        action: 'PANTRY_ITEM_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'PantryItem',
        entityId: created.id,
      });
      return created;
    });
    return mapPantry(item);
  }

  public async update(
    userId: string,
    itemId: string,
    input: PantryItemInputDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    const existing = await this.prisma.pantryItem.findFirst({
      where: { id: itemId, householdId: membership.householdId },
      select: { id: true },
    });
    if (!existing) throw mealsNotFound();
    await this.verifyIngredient(membership.householdId, input.ingredientId);
    const item = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.pantryItem.update({
        where: { id: itemId },
        data: { ...this.data(input), updatedByUserId: userId },
        include: pantryInclude,
      });
      await this.audit.record(tx, {
        action: 'PANTRY_ITEM_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'PantryItem',
        entityId: itemId,
      });
      return updated;
    });
    return mapPantry(item);
  }

  public async remove(userId: string, itemId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MEALS_WRITE_ROLE,
    );
    const result = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.pantryItem.deleteMany({
        where: { id: itemId, householdId: membership.householdId },
      });
      if (deleted.count)
        await this.audit.record(tx, {
          action: 'PANTRY_ITEM_DELETED',
          householdId: membership.householdId,
          userId,
          entityType: 'PantryItem',
          entityId: itemId,
        });
      return deleted;
    });
    if (!result.count) throw mealsNotFound();
    return { id: itemId };
  }

  private data(input: PantryItemInputDto) {
    return {
      ingredientId: input.ingredientId,
      quantityDecimal: input.quantity ? decimalQuantity(input.quantity) : null,
      unit: input.unit ?? null,
      status: input.status,
      expiresOn: input.expiresOn ? dateOnly(input.expiresOn) : null,
      locationLabel: optionalText(input.locationLabel),
      note: optionalText(input.note),
    };
  }

  private async verifyIngredient(householdId: string, ingredientId: string) {
    const count = await this.prisma.ingredient.count({
      where: { id: ingredientId, householdId, archivedAt: null },
    });
    if (!count) throw mealsNotFound();
  }
}
