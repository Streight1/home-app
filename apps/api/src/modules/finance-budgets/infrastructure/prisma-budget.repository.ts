import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import {
  dateOnly,
  dateOnlyString,
} from '../../finance/domain/finance.types.js';
import { parseMinorUnits } from '../../finance/domain/money.js';
import type {
  CreateBudgetDto,
  UpdateBudgetDto,
} from '../presentation/dto/budget.dto.js';

const includeBudget = {
  allocations: {
    include: {
      category: {
        select: { id: true, name: true, kind: true, archivedAt: true },
      },
    },
    orderBy: { category: { name: 'asc' as const } },
  },
} as const;

export type BudgetRecord = NonNullable<
  Awaited<ReturnType<PrismaBudgetRepository['find']>>
>;

@Injectable()
export class PrismaBudgetRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public list(
    householdId: string,
    filters: { currencyCode?: string; status?: string },
  ) {
    return this.prisma.financialBudget.findMany({
      where: {
        householdId,
        ...(filters.currencyCode ? { currencyCode: filters.currencyCode } : {}),
        ...(filters.status
          ? {
              status: filters.status as
                | 'DRAFT'
                | 'ACTIVE'
                | 'CLOSED'
                | 'ARCHIVED',
            }
          : { status: { not: 'ARCHIVED' as const } }),
      },
      include: includeBudget,
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
    });
  }

  public find(householdId: string, id: string) {
    return this.prisma.financialBudget.findFirst({
      where: { id, householdId },
      include: includeBudget,
    });
  }

  public listCategories(householdId: string, ids: readonly string[]) {
    return this.prisma.financialCategory.findMany({
      where: { householdId, id: { in: [...ids] } },
      select: { id: true, kind: true, archivedAt: true },
    });
  }

  public async create(
    householdId: string,
    userId: string,
    input: CreateBudgetDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const budget = await transaction.financialBudget.create({
        data: {
          householdId,
          name: input.name.trim(),
          currencyCode: input.currencyCode,
          periodType: input.periodType,
          periodStart: dateOnly(input.periodStart),
          periodEnd: dateOnly(input.periodEnd),
          totalLimitMinor: input.totalLimitMinor
            ? parseMinorUnits(input.totalLimitMinor)
            : null,
          status: input.status,
          createdByUserId: userId,
          updatedByUserId: userId,
          allocations: {
            create: input.allocations.map((allocation) => ({
              categoryId: allocation.categoryId,
              limitMinor: parseMinorUnits(allocation.limitMinor),
              warningThresholdPercent: allocation.warningThresholdPercent,
            })),
          },
        },
      });
      await this.audit.record(transaction, {
        action: 'FINANCIAL_BUDGET_CREATED',
        householdId,
        userId,
        entityType: 'FinancialBudget',
        entityId: budget.id,
        metadata: { budgetId: budget.id },
      });
      return budget.id;
    });
  }

  public async update(
    householdId: string,
    userId: string,
    id: string,
    input: UpdateBudgetDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.financialBudget.updateMany({
        where: { id, householdId, status: { not: 'ARCHIVED' } },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.totalLimitMinor !== undefined
            ? {
                totalLimitMinor:
                  input.totalLimitMinor === null
                    ? null
                    : parseMinorUnits(input.totalLimitMinor),
              }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedByUserId: userId,
        },
      });
      if (!updated.count) return false;
      if (input.allocations) {
        await transaction.financialBudgetAllocation.deleteMany({
          where: { budgetId: id },
        });
        await transaction.financialBudgetAllocation.createMany({
          data: input.allocations.map((allocation) => ({
            budgetId: id,
            categoryId: allocation.categoryId,
            limitMinor: parseMinorUnits(allocation.limitMinor),
            warningThresholdPercent: allocation.warningThresholdPercent,
          })),
        });
      }
      await this.audit.record(transaction, {
        action: 'FINANCIAL_BUDGET_UPDATED',
        householdId,
        userId,
        entityType: 'FinancialBudget',
        entityId: id,
        metadata: { budgetId: id, changedFields: Object.keys(input) },
      });
      return true;
    });
  }

  public async archive(householdId: string, userId: string, id: string) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.financialBudget.updateMany({
        where: { id, householdId, status: { not: 'ARCHIVED' } },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
          updatedByUserId: userId,
        },
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action: 'FINANCIAL_BUDGET_ARCHIVED',
        householdId,
        userId,
        entityType: 'FinancialBudget',
        entityId: id,
        metadata: { budgetId: id },
      });
      return true;
    });
  }

  public async copy(input: {
    householdId: string;
    userId: string;
    source: BudgetRecord;
    targetStart: Date;
    targetEnd: Date;
    name: string;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.financialBudget.findFirst({
        where: {
          householdId: input.householdId,
          currencyCode: input.source.currencyCode,
          periodStart: input.targetStart,
          periodEnd: input.targetEnd,
        },
        select: { id: true },
      });
      if (existing) return null;
      const budget = await transaction.financialBudget.create({
        data: {
          householdId: input.householdId,
          name: input.name,
          currencyCode: input.source.currencyCode,
          periodType: 'MONTHLY',
          periodStart: input.targetStart,
          periodEnd: input.targetEnd,
          totalLimitMinor: input.source.totalLimitMinor,
          status: 'DRAFT',
          createdByUserId: input.userId,
          updatedByUserId: input.userId,
          allocations: {
            create: input.source.allocations.map((allocation) => ({
              categoryId: allocation.categoryId,
              limitMinor: allocation.limitMinor,
              warningThresholdPercent: allocation.warningThresholdPercent,
            })),
          },
        },
      });
      await this.audit.record(transaction, {
        action: 'FINANCIAL_BUDGET_COPIED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'FinancialBudget',
        entityId: budget.id,
        metadata: { budgetId: budget.id, sourceBudgetId: input.source.id },
      });
      return budget.id;
    });
  }
}

export function mapBudget(record: BudgetRecord) {
  return {
    id: record.id,
    name: record.name,
    currencyCode: record.currencyCode,
    periodType: record.periodType,
    periodStart: dateOnlyString(record.periodStart),
    periodEnd: dateOnlyString(record.periodEnd),
    totalLimitMinor: record.totalLimitMinor?.toString() ?? null,
    status: record.status,
    archivedAt: record.archivedAt?.toISOString() ?? null,
    allocations: record.allocations.map((allocation) => ({
      id: allocation.id,
      category: allocation.category,
      limitMinor: allocation.limitMinor.toString(),
      warningThresholdPercent: allocation.warningThresholdPercent,
    })),
  };
}
