import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import {
  normalizeFinanceName,
  recommendedFinanceCategories,
} from '../domain/finance.types.js';
import type {
  CreateFinancialCategoryDto,
  UpdateFinancialCategoryDto,
} from '../presentation/dto/financial-category.dto.js';

@Injectable()
export class PrismaFinancialCategoryRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async list(householdId: string, includeArchived = false) {
    const categories = await this.prisma.financialCategory.findMany({
      where: { householdId, ...(!includeArchived ? { archivedAt: null } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map((category) => ({
      id: category.id,
      parentId: category.parentId,
      name: category.name,
      kind: category.kind,
      colorToken: category.colorToken,
      iconKey: category.iconKey,
      sortOrder: category.sortOrder,
      archivedAt: category.archivedAt?.toISOString() ?? null,
    }));
  }

  public findRecord(householdId: string, id: string) {
    return this.prisma.financialCategory.findFirst({
      where: { id, householdId },
      include: { parent: true, children: { where: { archivedAt: null } } },
    });
  }

  public async create(
    householdId: string,
    userId: string,
    input: CreateFinancialCategoryDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const category = await transaction.financialCategory.create({
        data: {
          householdId,
          parentId: input.parentId ?? null,
          name: input.name,
          normalizedName: normalizeFinanceName(input.name),
          kind: input.kind,
          colorToken: input.colorToken,
          iconKey: input.iconKey,
          sortOrder: input.sortOrder,
          createdByUserId: userId,
        },
      });
      await this.audit.record(transaction, {
        action: 'FINANCIAL_CATEGORY_CREATED',
        householdId,
        userId,
        entityType: 'FinancialCategory',
        entityId: category.id,
        metadata: { categoryId: category.id, kind: category.kind },
      });
      return category.id;
    });
  }

  public async update(
    householdId: string,
    userId: string,
    id: string,
    input: UpdateFinancialCategoryDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.financialCategory.updateMany({
        where: { id, householdId },
        data: {
          ...(input.name !== undefined
            ? {
                name: input.name,
                normalizedName: normalizeFinanceName(input.name),
              }
            : {}),
          ...(input.kind !== undefined ? { kind: input.kind } : {}),
          ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
          ...(input.colorToken !== undefined
            ? { colorToken: input.colorToken }
            : {}),
          ...(input.iconKey !== undefined ? { iconKey: input.iconKey } : {}),
          ...(input.sortOrder !== undefined
            ? { sortOrder: input.sortOrder }
            : {}),
        },
      });
      if (result.count === 0) return false;
      await this.audit.record(transaction, {
        action: 'FINANCIAL_CATEGORY_UPDATED',
        householdId,
        userId,
        entityType: 'FinancialCategory',
        entityId: id,
        metadata: { categoryId: id, changedFields: Object.keys(input) },
      });
      return true;
    });
  }

  public async archive(householdId: string, userId: string, id: string) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.financialCategory.updateMany({
        where: { id, householdId },
        data: { archivedAt: new Date() },
      });
      if (result.count === 0) return false;
      await this.audit.record(transaction, {
        action: 'FINANCIAL_CATEGORY_ARCHIVED',
        householdId,
        userId,
        entityType: 'FinancialCategory',
        entityId: id,
        metadata: { categoryId: id },
      });
      return true;
    });
  }

  public async createRecommended(householdId: string, userId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.financialCategory.findMany({
        where: { householdId, parentId: null },
        select: { normalizedName: true },
      });
      const names = new Set(
        existing.map((category) => category.normalizedName),
      );
      const missing = recommendedFinanceCategories.filter(
        (category) => !names.has(normalizeFinanceName(category.name)),
      );
      if (missing.length > 0) {
        await transaction.financialCategory.createMany({
          data: missing.map((category, index) => ({
            householdId,
            parentId: null,
            name: category.name,
            normalizedName: normalizeFinanceName(category.name),
            kind: category.kind,
            colorToken: category.colorToken,
            iconKey: category.iconKey,
            sortOrder: index,
            createdByUserId: userId,
          })),
        });
      }
      await this.audit.record(transaction, {
        action: 'RECOMMENDED_FINANCIAL_CATEGORIES_CREATED',
        householdId,
        userId,
        entityType: 'FinancialCategory',
        metadata: { createdCount: missing.length },
      });
      return missing.length;
    });
  }
}
