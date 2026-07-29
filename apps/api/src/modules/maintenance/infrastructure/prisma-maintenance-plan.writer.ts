import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { maintenanceDate } from '../domain/maintenance.types.js';
import type {
  CreateMaintenancePlanDto,
  UpdateMaintenancePlanDto,
} from '../presentation/dto/maintenance.dto.js';

@Injectable()
export class PrismaMaintenancePlanWriter {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async create(input: {
    householdId: string;
    userId: string;
    plan: CreateMaintenancePlanDto;
    recurrenceDefinition: Prisma.InputJsonValue;
    occurrenceDates: readonly string[];
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const plan = await transaction.maintenancePlan.create({
        data: {
          householdId: input.householdId,
          categoryId: input.plan.categoryId ?? null,
          title: input.plan.title.trim(),
          description: input.plan.description ?? null,
          instructions: input.plan.instructions ?? null,
          priority: input.plan.priority,
          recurrenceDefinition: input.recurrenceDefinition,
          recurrenceBasis: input.plan.recurrenceBasis,
          startsOn: maintenanceDate(input.plan.startsOn),
          endsOn: input.plan.endsOn ? maintenanceDate(input.plan.endsOn) : null,
          nextDueOn: maintenanceDate(
            input.occurrenceDates[0] ?? input.plan.startsOn,
          ),
          leadDays: input.plan.leadDays,
          estimatedDurationMinutes: input.plan.estimatedDurationMinutes ?? null,
          preferredStartTime: input.plan.preferredStartTime ?? null,
          responsibleUserId: input.plan.responsibleUserId ?? null,
          locationLabel: input.plan.locationLabel ?? null,
          providerName: input.plan.providerName ?? null,
          defaultCostMinor: input.plan.defaultCostMinor
            ? BigInt(input.plan.defaultCostMinor)
            : null,
          defaultCurrencyCode: input.plan.defaultCurrencyCode ?? null,
          autoCreateTask: input.plan.autoCreateTask,
          taskCreateDaysBefore: input.plan.taskCreateDaysBefore,
          createdByUserId: input.userId,
          updatedByUserId: input.userId,
        },
      });
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_PLAN_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'MaintenancePlan',
        entityId: plan.id,
        metadata: { planId: plan.id, priority: plan.priority },
      });
      for (const date of input.occurrenceDates)
        await this.createOccurrence(transaction, input, plan.id, date);
      return plan.id;
    });
  }

  public async update(input: {
    householdId: string;
    userId: string;
    planId: string;
    plan: UpdateMaintenancePlanDto;
    recurrenceDefinition?: Prisma.InputJsonValue;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.maintenancePlan.updateMany({
        where: {
          id: input.planId,
          householdId: input.householdId,
          status: { not: 'ARCHIVED' },
        },
        data: updateData(input),
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_PLAN_UPDATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'MaintenancePlan',
        entityId: input.planId,
        metadata: {
          planId: input.planId,
          changedFields: Object.keys(input.plan),
        },
      });
      return true;
    });
  }

  public async transition(input: {
    householdId: string;
    userId: string;
    planId: string;
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    now: Date;
    action:
      | 'MAINTENANCE_PLAN_PAUSED'
      | 'MAINTENANCE_PLAN_RESUMED'
      | 'MAINTENANCE_PLAN_ARCHIVED'
      | 'MAINTENANCE_PLAN_RESTORED';
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.maintenancePlan.updateMany({
        where: { id: input.planId, householdId: input.householdId },
        data: {
          status: input.status,
          pausedAt: input.status === 'PAUSED' ? input.now : null,
          archivedAt: input.status === 'ARCHIVED' ? input.now : null,
          updatedByUserId: input.userId,
        },
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action: input.action,
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'MaintenancePlan',
        entityId: input.planId,
        metadata: { planId: input.planId },
      });
      return true;
    });
  }

  private async createOccurrence(
    transaction: Prisma.TransactionClient,
    input: { householdId: string; userId: string },
    planId: string,
    date: string,
  ) {
    const occurrence = await transaction.maintenanceOccurrence.create({
      data: {
        householdId: input.householdId,
        maintenancePlanId: planId,
        scheduledFor: maintenanceDate(date),
        originalScheduledFor: maintenanceDate(date),
      },
    });
    await this.audit.record(transaction, {
      action: 'MAINTENANCE_OCCURRENCE_CREATED',
      householdId: input.householdId,
      userId: input.userId,
      entityType: 'MaintenanceOccurrence',
      entityId: occurrence.id,
      metadata: { planId, occurrenceId: occurrence.id },
    });
  }
}

function updateData(input: {
  userId: string;
  plan: UpdateMaintenancePlanDto;
  recurrenceDefinition?: Prisma.InputJsonValue;
}): Prisma.MaintenancePlanUncheckedUpdateManyInput {
  const plan = input.plan;
  return {
    ...(plan.title !== undefined ? { title: plan.title.trim() } : {}),
    ...(plan.description !== undefined
      ? { description: plan.description }
      : {}),
    ...(plan.instructions !== undefined
      ? { instructions: plan.instructions }
      : {}),
    ...(plan.priority !== undefined ? { priority: plan.priority } : {}),
    ...(plan.categoryId !== undefined ? { categoryId: plan.categoryId } : {}),
    ...(input.recurrenceDefinition
      ? { recurrenceDefinition: input.recurrenceDefinition }
      : {}),
    ...(plan.recurrenceBasis !== undefined
      ? { recurrenceBasis: plan.recurrenceBasis }
      : {}),
    ...(plan.startsOn !== undefined
      ? { startsOn: maintenanceDate(plan.startsOn) }
      : {}),
    ...(plan.endsOn !== undefined
      ? { endsOn: plan.endsOn ? maintenanceDate(plan.endsOn) : null }
      : {}),
    ...(plan.leadDays !== undefined ? { leadDays: plan.leadDays } : {}),
    ...(plan.estimatedDurationMinutes !== undefined
      ? { estimatedDurationMinutes: plan.estimatedDurationMinutes }
      : {}),
    ...(plan.preferredStartTime !== undefined
      ? { preferredStartTime: plan.preferredStartTime }
      : {}),
    ...(plan.responsibleUserId !== undefined
      ? { responsibleUserId: plan.responsibleUserId }
      : {}),
    ...(plan.locationLabel !== undefined
      ? { locationLabel: plan.locationLabel }
      : {}),
    ...(plan.providerName !== undefined
      ? { providerName: plan.providerName }
      : {}),
    ...(plan.defaultCostMinor !== undefined
      ? {
          defaultCostMinor: plan.defaultCostMinor
            ? BigInt(plan.defaultCostMinor)
            : null,
        }
      : {}),
    ...(plan.defaultCurrencyCode !== undefined
      ? { defaultCurrencyCode: plan.defaultCurrencyCode }
      : {}),
    ...(plan.autoCreateTask !== undefined
      ? { autoCreateTask: plan.autoCreateTask }
      : {}),
    ...(plan.taskCreateDaysBefore !== undefined
      ? { taskCreateDaysBefore: plan.taskCreateDaysBefore }
      : {}),
    updatedByUserId: input.userId,
  };
}
