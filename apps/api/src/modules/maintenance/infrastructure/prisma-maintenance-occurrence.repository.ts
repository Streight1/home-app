import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { maintenanceDate } from '../domain/maintenance.types.js';
import type { ListMaintenanceOccurrencesQueryDto } from '../presentation/dto/maintenance.dto.js';
import { advanceCompletedMaintenancePlan } from './maintenance-progression.transaction.js';
import { occurrenceInclude } from './prisma-maintenance-plan.repository.js';

const listInclude = {
  ...occurrenceInclude,
  maintenancePlan: {
    select: {
      id: true,
      title: true,
      priority: true,
      status: true,
      recurrenceBasis: true,
      recurrenceDefinition: true,
      startsOn: true,
      endsOn: true,
      nextDueOn: true,
      preferredStartTime: true,
      responsibleUserId: true,
      estimatedDurationMinutes: true,
      locationLabel: true,
      providerName: true,
      category: {
        select: {
          id: true,
          name: true,
          iconKey: true,
          colorToken: true,
        },
      },
      responsible: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  },
} as const;

@Injectable()
export class PrismaMaintenanceOccurrenceRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async list(
    householdId: string,
    query: ListMaintenanceOccurrencesQueryDto,
  ) {
    const where = {
      householdId,
      ...(query.planId ? { maintenancePlanId: query.planId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            scheduledFor: {
              ...(query.from ? { gte: maintenanceDate(query.from) } : {}),
              ...(query.to ? { lte: maintenanceDate(query.to) } : {}),
            },
          }
        : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.maintenanceOccurrence.findMany({
        where,
        include: listInclude,
        orderBy: [{ scheduledFor: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.maintenanceOccurrence.count({ where }),
    ]);
    return { items, totalItems };
  }

  public find(householdId: string, occurrenceId: string) {
    return this.prisma.maintenanceOccurrence.findFirst({
      where: { id: occurrenceId, householdId },
      include: listInclude,
    });
  }

  public async complete(input: {
    householdId: string;
    userId: string;
    occurrenceId: string;
    completedOn: string;
    completedByUserId: string;
    completedAt: Date;
    notes: string | null;
    providerName: string | null;
    actualCostMinor: string | null;
    currencyCode: string | null;
    documentIds: readonly string[];
    transactionIds: readonly string[];
    nextOccurrenceDate: string | null;
    beforeCommit?: (transaction: Prisma.TransactionClient) => Promise<void>;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.maintenanceOccurrence.updateMany({
        where: {
          id: input.occurrenceId,
          householdId: input.householdId,
          status: { in: ['SCHEDULED', 'TASK_CREATED'] },
        },
        data: {
          status: 'COMPLETED',
          completedOn: maintenanceDate(input.completedOn),
          completedAt: input.completedAt,
          completedByUserId: input.completedByUserId,
          completionNotes: input.notes,
          providerName: input.providerName,
          actualCostMinor: input.actualCostMinor
            ? BigInt(input.actualCostMinor)
            : null,
          currencyCode: input.currencyCode,
        },
      });
      if (!result.count) return false;
      if (input.beforeCommit) await input.beforeCommit(transaction);
      await transaction.maintenanceOccurrenceDocument.deleteMany({
        where: { maintenanceOccurrenceId: input.occurrenceId },
      });
      if (input.documentIds.length)
        await transaction.maintenanceOccurrenceDocument.createMany({
          data: input.documentIds.map((documentId) => ({
            maintenanceOccurrenceId: input.occurrenceId,
            documentId,
            relationType: 'OTHER',
            createdByUserId: input.userId,
          })),
        });
      await transaction.maintenanceOccurrenceTransaction.deleteMany({
        where: { maintenanceOccurrenceId: input.occurrenceId },
      });
      if (input.transactionIds.length)
        await transaction.maintenanceOccurrenceTransaction.createMany({
          data: input.transactionIds.map((transactionId) => ({
            maintenanceOccurrenceId: input.occurrenceId,
            transactionId,
            relationType: 'OTHER',
            createdByUserId: input.userId,
          })),
        });
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_OCCURRENCE_COMPLETED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'MaintenanceOccurrence',
        entityId: input.occurrenceId,
        metadata: {
          occurrenceId: input.occurrenceId,
          documentCount: input.documentIds.length,
          transactionCount: input.transactionIds.length,
        },
      });
      await advanceCompletedMaintenancePlan(transaction, this.audit, input);
      return true;
    });
  }

  public async skip(input: {
    householdId: string;
    userId: string;
    occurrenceId: string;
    reason: string | null;
    now: Date;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.maintenanceOccurrence.updateMany({
        where: {
          id: input.occurrenceId,
          householdId: input.householdId,
          status: { in: ['SCHEDULED', 'TASK_CREATED'] },
        },
        data: {
          status: 'SKIPPED',
          skippedAt: input.now,
          skippedByUserId: input.userId,
          skipReason: input.reason,
        },
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_OCCURRENCE_SKIPPED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'MaintenanceOccurrence',
        entityId: input.occurrenceId,
        metadata: { occurrenceId: input.occurrenceId },
      });
      return true;
    });
  }

  public async reschedule(input: {
    householdId: string;
    userId: string;
    occurrenceId: string;
    scheduledFor: string;
    now: Date;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.maintenanceOccurrence.updateMany({
        where: {
          id: input.occurrenceId,
          householdId: input.householdId,
          status: { in: ['SCHEDULED', 'TASK_CREATED'] },
        },
        data: {
          scheduledFor: maintenanceDate(input.scheduledFor),
          rescheduledAt: input.now,
          rescheduledByUserId: input.userId,
        },
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_OCCURRENCE_RESCHEDULED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'MaintenanceOccurrence',
        entityId: input.occurrenceId,
        metadata: { occurrenceId: input.occurrenceId },
      });
      return true;
    });
  }

  public async linkTask(input: {
    householdId: string;
    userId: string;
    occurrenceId: string;
    taskId: string;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const occurrence = await transaction.maintenanceOccurrence.findFirst({
        where: {
          id: input.occurrenceId,
          householdId: input.householdId,
          status: 'SCHEDULED',
          taskId: null,
        },
        select: { id: true },
      });
      if (!occurrence) return false;
      await transaction.maintenanceTaskLink.create({
        data: {
          maintenanceOccurrenceId: input.occurrenceId,
          taskId: input.taskId,
          createdByUserId: input.userId,
        },
      });
      await transaction.maintenanceOccurrence.update({
        where: { id: input.occurrenceId },
        data: { taskId: input.taskId, status: 'TASK_CREATED' },
      });
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_TASK_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'MaintenanceOccurrence',
        entityId: input.occurrenceId,
        metadata: { occurrenceId: input.occurrenceId, taskId: input.taskId },
      });
      return true;
    });
  }
}

export type MaintenanceOccurrenceRecord = NonNullable<
  Awaited<ReturnType<PrismaMaintenanceOccurrenceRepository['find']>>
>;
