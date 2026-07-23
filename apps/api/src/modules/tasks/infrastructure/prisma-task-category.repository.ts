import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import type {
  TaskCategoryColorToken,
  TaskCategoryRecord,
  TaskCategoryRepository,
} from '../domain/ports/task-category.repository.js';

function record(category: {
  id: string;
  householdId: string;
  name: string;
  normalizedName: string;
  colorToken: string;
  createdAt: Date;
  updatedAt: Date;
}): TaskCategoryRecord {
  return {
    ...category,
    colorToken: category.colorToken as TaskCategoryColorToken,
  };
}

@Injectable()
export class PrismaTaskCategoryRepository implements TaskCategoryRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async list(householdId: string) {
    return (
      await this.prisma.taskCategory.findMany({
        where: { householdId },
        orderBy: { name: 'asc' },
      })
    ).map(record);
  }

  public async findById(householdId: string, categoryId: string) {
    const category = await this.prisma.taskCategory.findFirst({
      where: { id: categoryId, householdId },
    });
    return category ? record(category) : null;
  }

  public async create(input: {
    householdId: string;
    userId: string;
    name: string;
    normalizedName: string;
    colorToken: TaskCategoryColorToken;
  }) {
    const category = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.taskCategory.create({
        data: {
          householdId: input.householdId,
          createdByUserId: input.userId,
          name: input.name,
          normalizedName: input.normalizedName,
          colorToken: input.colorToken,
        },
      });
      await this.audit.record(transaction, {
        action: 'TASK_CATEGORY_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'TaskCategory',
        entityId: created.id,
        metadata: { categoryId: created.id },
      });
      return created;
    });
    return record(category);
  }

  public async update(input: {
    householdId: string;
    userId: string;
    categoryId: string;
    name?: string;
    normalizedName?: string;
    colorToken?: TaskCategoryColorToken;
    changedFields: readonly string[];
  }) {
    const changed = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.taskCategory.updateMany({
        where: { id: input.categoryId, householdId: input.householdId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.normalizedName !== undefined
            ? { normalizedName: input.normalizedName }
            : {}),
          ...(input.colorToken !== undefined
            ? { colorToken: input.colorToken }
            : {}),
        },
      });
      if (result.count === 0) return false;
      await this.audit.record(transaction, {
        action: 'TASK_CATEGORY_UPDATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'TaskCategory',
        entityId: input.categoryId,
        metadata: {
          categoryId: input.categoryId,
          changedFields: input.changedFields,
        },
      });
      return true;
    });
    return changed ? this.findById(input.householdId, input.categoryId) : null;
  }

  public async delete(input: {
    householdId: string;
    userId: string;
    categoryId: string;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.taskCategory.findFirst({
        where: { id: input.categoryId, householdId: input.householdId },
        select: { id: true },
      });
      if (!existing) return false;
      await transaction.task.updateMany({
        where: { householdId: input.householdId, categoryId: input.categoryId },
        data: { categoryId: null, updatedByUserId: input.userId },
      });
      await transaction.taskCategory.delete({
        where: { id: input.categoryId },
      });
      await this.audit.record(transaction, {
        action: 'TASK_CATEGORY_DELETED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'TaskCategory',
        entityId: input.categoryId,
        metadata: { categoryId: input.categoryId },
      });
      return true;
    });
  }
}
