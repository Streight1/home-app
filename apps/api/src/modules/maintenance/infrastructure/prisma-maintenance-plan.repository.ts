import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import {
  maintenanceDate,
  maintenanceDateString,
} from '../domain/maintenance.types.js';
import type { ListMaintenancePlansQueryDto } from '../presentation/dto/maintenance.dto.js';

export const maintenancePlanListInclude = {
  category: {
    select: {
      id: true,
      name: true,
      iconKey: true,
      colorToken: true,
      archivedAt: true,
    },
  },
  responsible: {
    select: { id: true, displayName: true, avatarUrl: true },
  },
  _count: { select: { occurrences: true } },
} as const;

export const occurrenceInclude = {
  taskLinks: {
    where: { removedAt: null },
    select: { taskId: true, createdAt: true },
  },
  documents: {
    select: { documentId: true, relationType: true },
  },
  transactions: {
    select: { transactionId: true, relationType: true },
  },
  completedBy: {
    select: { id: true, displayName: true, avatarUrl: true },
  },
  skippedBy: {
    select: { id: true, displayName: true, avatarUrl: true },
  },
  rescheduledBy: {
    select: { id: true, displayName: true, avatarUrl: true },
  },
} as const;

@Injectable()
export class PrismaMaintenancePlanRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async list(
    householdId: string,
    query: ListMaintenancePlansQueryDto,
    today: string,
  ) {
    const where = planListWhere(householdId, query, today);
    const [items, totalItems] = await Promise.all([
      this.prisma.maintenancePlan.findMany({
        where,
        include: maintenancePlanListInclude,
        orderBy: [
          query.sortBy === 'nextDueOn'
            ? {
                nextDueOn: {
                  sort: query.sortDirection,
                  nulls: 'last',
                },
              }
            : { [query.sortBy]: query.sortDirection },
          { id: 'asc' },
        ],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.maintenancePlan.count({ where }),
    ]);
    return { items, totalItems };
  }

  public find(householdId: string, planId: string) {
    return this.prisma.maintenancePlan.findFirst({
      where: { id: planId, householdId },
      include: {
        ...maintenancePlanListInclude,
        occurrences: {
          include: occurrenceInclude,
          orderBy: [{ scheduledFor: 'desc' }, { id: 'asc' }],
          take: 50,
        },
      },
    });
  }

  public generationCandidates(limit = 100) {
    return this.prisma.maintenancePlan.findMany({
      where: { status: 'ACTIVE', archivedAt: null },
      orderBy: [{ nextDueOn: 'asc' }, { id: 'asc' }],
      take: limit,
      select: {
        id: true,
        household: {
          select: {
            members: {
              where: {
                role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
                user: { status: 'ACTIVE' },
              },
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
              take: 1,
              select: { userId: true },
            },
          },
        },
      },
    });
  }

  public async generate(
    householdId: string,
    userId: string,
    planId: string,
    dates: readonly string[],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const created =
        await transaction.maintenanceOccurrence.createManyAndReturn({
          data: [...new Set(dates)].map((date) => ({
            householdId,
            maintenancePlanId: planId,
            scheduledFor: maintenanceDate(date),
            originalScheduledFor: maintenanceDate(date),
          })),
          skipDuplicates: true,
          select: { id: true },
        });
      for (const occurrence of created)
        await this.audit.record(transaction, {
          action: 'MAINTENANCE_OCCURRENCE_CREATED',
          householdId,
          userId,
          entityType: 'MaintenanceOccurrence',
          entityId: occurrence.id,
          metadata: { planId, occurrenceId: occurrence.id },
        });
      await this.refreshNextDue(transaction, householdId, planId);
      return created.length;
    });
  }

  public refreshNextDueForPlan(householdId: string, planId: string) {
    return this.prisma.$transaction((transaction) =>
      this.refreshNextDue(transaction, householdId, planId),
    );
  }

  public async completeWhenNoPending(
    householdId: string,
    userId: string,
    planId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const pending = await transaction.maintenanceOccurrence.count({
        where: {
          householdId,
          maintenancePlanId: planId,
          status: { in: ['SCHEDULED', 'TASK_CREATED'] },
        },
      });
      if (pending) return false;
      const result = await transaction.maintenancePlan.updateMany({
        where: { id: planId, householdId, status: 'ACTIVE' },
        data: { status: 'COMPLETED', nextDueOn: null, updatedByUserId: userId },
      });
      return result.count > 0;
    });
  }

  private async refreshNextDue(
    transaction: Prisma.TransactionClient,
    householdId: string,
    planId: string,
  ) {
    const next = await transaction.maintenanceOccurrence.findFirst({
      where: {
        householdId,
        maintenancePlanId: planId,
        status: { in: ['SCHEDULED', 'TASK_CREATED'] },
      },
      orderBy: [{ scheduledFor: 'asc' }, { id: 'asc' }],
      select: { scheduledFor: true },
    });
    await transaction.maintenancePlan.updateMany({
      where: { id: planId, householdId },
      data: { nextDueOn: next?.scheduledFor ?? null },
    });
    return maintenanceDateString(next?.scheduledFor ?? null);
  }
}

function planListWhere(
  householdId: string,
  query: ListMaintenancePlansQueryDto,
  today: string,
): Prisma.MaintenancePlanWhereInput {
  return {
    householdId,
    ...(query.status ? { status: query.status } : { status: 'ACTIVE' }),
    ...(query.pausedOnly ? { status: 'PAUSED' } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.responsibleUserId
      ? { responsibleUserId: query.responsibleUserId }
      : {}),
    ...(query.query
      ? {
          OR: [
            { title: { contains: query.query, mode: 'insensitive' } },
            { description: { contains: query.query, mode: 'insensitive' } },
            { providerName: { contains: query.query, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(query.overdueOnly
      ? { status: 'ACTIVE', nextDueOn: { lt: maintenanceDate(today) } }
      : {}),
    ...(!query.overdueOnly && (query.dueFrom || query.dueTo)
      ? {
          nextDueOn: {
            ...(query.dueFrom ? { gte: maintenanceDate(query.dueFrom) } : {}),
            ...(query.dueTo ? { lte: maintenanceDate(query.dueTo) } : {}),
          },
        }
      : {}),
  };
}

export type MaintenancePlanRecord = NonNullable<
  Awaited<ReturnType<PrismaMaintenancePlanRepository['find']>>
>;
export type MaintenancePlanListRecord = Awaited<
  ReturnType<PrismaMaintenancePlanRepository['list']>
>['items'][number];
