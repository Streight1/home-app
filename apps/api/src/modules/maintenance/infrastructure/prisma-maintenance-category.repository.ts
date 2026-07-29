import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { normalizeMaintenanceName } from '../domain/maintenance.types.js';
import type {
  CreateMaintenanceCategoryDto,
  UpdateMaintenanceCategoryDto,
} from '../presentation/dto/maintenance.dto.js';

@Injectable()
export class PrismaMaintenanceCategoryRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public list(householdId: string, includeArchived = false) {
    return this.prisma.maintenanceCategory.findMany({
      where: { householdId, ...(!includeArchived ? { archivedAt: null } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  public find(householdId: string, categoryId: string) {
    return this.prisma.maintenanceCategory.findFirst({
      where: { id: categoryId, householdId },
    });
  }

  public async create(
    householdId: string,
    userId: string,
    input: CreateMaintenanceCategoryDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const category = await transaction.maintenanceCategory.create({
        data: {
          householdId,
          name: input.name.trim(),
          normalizedName: normalizeMaintenanceName(input.name),
          iconKey: input.iconKey,
          colorToken: input.colorToken,
          sortOrder: input.sortOrder,
          createdByUserId: userId,
        },
      });
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_CATEGORY_CREATED',
        householdId,
        userId,
        entityType: 'MaintenanceCategory',
        entityId: category.id,
        metadata: { categoryId: category.id },
      });
      return category;
    });
  }

  public async update(
    householdId: string,
    userId: string,
    categoryId: string,
    input: UpdateMaintenanceCategoryDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.maintenanceCategory.updateMany({
        where: { id: categoryId, householdId, archivedAt: null },
        data: {
          ...(input.name !== undefined
            ? {
                name: input.name.trim(),
                normalizedName: normalizeMaintenanceName(input.name),
              }
            : {}),
          ...(input.iconKey !== undefined ? { iconKey: input.iconKey } : {}),
          ...(input.colorToken !== undefined
            ? { colorToken: input.colorToken }
            : {}),
          ...(input.sortOrder !== undefined
            ? { sortOrder: input.sortOrder }
            : {}),
        },
      });
      if (!result.count) return null;
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_CATEGORY_UPDATED',
        householdId,
        userId,
        entityType: 'MaintenanceCategory',
        entityId: categoryId,
        metadata: { categoryId, changedFields: Object.keys(input) },
      });
      return transaction.maintenanceCategory.findUnique({
        where: { id: categoryId },
      });
    });
  }

  public async archive(
    householdId: string,
    userId: string,
    categoryId: string,
    now: Date,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.maintenanceCategory.updateMany({
        where: { id: categoryId, householdId, archivedAt: null },
        data: { archivedAt: now },
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_CATEGORY_ARCHIVED',
        householdId,
        userId,
        entityType: 'MaintenanceCategory',
        entityId: categoryId,
        metadata: { categoryId },
      });
      return true;
    });
  }

  public async createRecommended(householdId: string, userId: string) {
    const categories = recommendedCategories.map((item, index) => ({
      ...item,
      householdId,
      normalizedName: normalizeMaintenanceName(item.name),
      sortOrder: index,
      createdByUserId: userId,
    }));
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.maintenanceCategory.createMany({
        data: categories,
        skipDuplicates: true,
      });
      if (result.count)
        await this.audit.record(transaction, {
          action: 'MAINTENANCE_CATEGORY_CREATED',
          householdId,
          userId,
          entityType: 'MaintenanceCategory',
          metadata: { createdCount: result.count, recommended: true },
        });
      return result.count;
    });
  }
}

const recommendedCategories = [
  { name: 'Topení a kotel', iconKey: 'flame', colorToken: 'orange' },
  { name: 'Elektřina', iconKey: 'zap', colorToken: 'amber' },
  { name: 'Voda', iconKey: 'droplets', colorToken: 'blue' },
  {
    name: 'Klimatizace a vzduchotechnika',
    iconKey: 'wind',
    colorToken: 'cyan',
  },
  { name: 'Fotovoltaika', iconKey: 'sun', colorToken: 'amber' },
  { name: 'Komín a krb', iconKey: 'flame', colorToken: 'rose' },
  { name: 'Zahrada', iconKey: 'trees', colorToken: 'green' },
  { name: 'Spotřebiče', iconKey: 'washing-machine', colorToken: 'violet' },
  { name: 'Bezpečnost', iconKey: 'shield-check', colorToken: 'rose' },
  { name: 'Úklid a péče', iconKey: 'sparkles', colorToken: 'pink' },
  { name: 'IT a zálohy', iconKey: 'database-backup', colorToken: 'blue' },
  { name: 'Ostatní', iconKey: 'circle-ellipsis', colorToken: 'violet' },
] as const;
