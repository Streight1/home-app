import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  EXPEDITIONS_ADMIN_ROLE,
  EXPEDITIONS_READ_ROLE,
  normalizeGearName,
} from '../domain/expeditions.types.js';
import { expeditionsNotFound } from '../domain/expeditions.errors.js';
import type { GearCategoryInputDto } from '../presentation/dto/gear.dto.js';

const recommended = [
  ['Batoh', 'backpack', 'green'],
  ['Přístřešek', 'tent-tree', 'amber'],
  ['Spaní', 'bed', 'blue'],
  ['Oblečení', 'shirt', 'cyan'],
  ['Vaření', 'cooking-pot', 'orange'],
  ['Voda', 'droplets', 'blue'],
  ['Jídlo', 'sandwich', 'amber'],
  ['Elektronika', 'battery-charging', 'violet'],
  ['Hygiena', 'sparkles', 'pink'],
  ['Lékárnička', 'briefcase-medical', 'rose'],
  ['Navigace', 'compass', 'green'],
  ['Opravy', 'wrench', 'neutral'],
  ['Ostatní', 'package', 'neutral'],
] as const;

@Injectable()
export class GearCategoriesService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly audit: AuditService,
  ) {}

  public async list(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_READ_ROLE,
    );
    return this.prisma.gearCategory.findMany({
      where: { householdId: membership.householdId, archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  public async create(userId: string, input: GearCategoryInputDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_ADMIN_ROLE,
    );
    return this.prisma.$transaction(async (tx) => {
      const category = await tx.gearCategory.create({
        data: {
          householdId: membership.householdId,
          name: input.name.trim(),
          normalizedName: normalizeGearName(input.name),
          iconKey: input.iconKey,
          colorToken: input.colorToken,
          sortOrder: input.sortOrder,
          createdByUserId: userId,
        },
      });
      await this.audit.record(tx, {
        action: 'GEAR_CATEGORY_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'GearCategory',
        entityId: category.id,
      });
      return category;
    });
  }

  public async update(
    userId: string,
    categoryId: string,
    input: GearCategoryInputDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_ADMIN_ROLE,
    );
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.gearCategory.findFirst({
        where: { id: categoryId, householdId: membership.householdId },
      });
      if (!existing) throw expeditionsNotFound();
      const category = await tx.gearCategory.update({
        where: { id: categoryId },
        data: {
          name: input.name.trim(),
          normalizedName: normalizeGearName(input.name),
          iconKey: input.iconKey,
          colorToken: input.colorToken,
          sortOrder: input.sortOrder,
        },
      });
      await this.audit.record(tx, {
        action: 'GEAR_CATEGORY_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'GearCategory',
        entityId: categoryId,
      });
      return category;
    });
  }

  public async archive(userId: string, categoryId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_ADMIN_ROLE,
    );
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.gearCategory.findFirst({
        where: { id: categoryId, householdId: membership.householdId },
      });
      if (!existing) throw expeditionsNotFound();
      const category = await tx.gearCategory.update({
        where: { id: categoryId },
        data: { archivedAt: new Date() },
      });
      await this.audit.record(tx, {
        action: 'GEAR_CATEGORY_ARCHIVED',
        householdId: membership.householdId,
        userId,
        entityType: 'GearCategory',
        entityId: categoryId,
      });
      return category;
    });
  }

  public async createRecommended(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      EXPEDITIONS_ADMIN_ROLE,
    );
    const createdCount = await this.prisma.$transaction(async (tx) => {
      let count = 0;
      for (const [
        index,
        [name, iconKey, colorToken],
      ] of recommended.entries()) {
        const result = await tx.gearCategory.createMany({
          data: {
            householdId: membership.householdId,
            name,
            normalizedName: normalizeGearName(name),
            iconKey,
            colorToken,
            sortOrder: index,
            createdByUserId: userId,
          },
          skipDuplicates: true,
        });
        count += result.count;
      }
      if (count > 0)
        await this.audit.record(tx, {
          action: 'RECOMMENDED_GEAR_CATEGORIES_CREATED',
          householdId: membership.householdId,
          userId,
          entityType: 'GearCategory',
          metadata: { createdCount: count },
        });
      return count;
    });
    return { createdCount };
  }
}
