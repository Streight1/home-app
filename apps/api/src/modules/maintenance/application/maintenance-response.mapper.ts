import { Injectable } from '@nestjs/common';
import type { HouseholdRole } from '../../households/household.types.js';
import type { SafeDocumentSummary } from '../../documents/documents.facade.js';
import { maintenanceDateString } from '../domain/maintenance.types.js';
import type { MaintenanceOccurrenceRecord } from '../infrastructure/prisma-maintenance-occurrence.repository.js';
import type {
  MaintenancePlanListRecord,
  MaintenancePlanRecord,
} from '../infrastructure/prisma-maintenance-plan.repository.js';

export interface SafeTransactionSummary {
  id: string;
  type: string;
  amountMinor: string;
  currencyCode: string;
  bookedDate: string;
  description: string | null;
  counterpartyName: string | null;
}

@Injectable()
export class MaintenanceResponseMapper {
  public plan(
    record: MaintenancePlanListRecord | MaintenancePlanRecord,
    role: HouseholdRole,
    today: string,
  ) {
    const nextDueOn = maintenanceDateString(record.nextDueOn);
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      instructions: record.instructions,
      priority: record.priority,
      status: record.status,
      recurrence: record.recurrenceDefinition,
      recurrenceBasis: record.recurrenceBasis,
      startsOn: maintenanceDateString(record.startsOn),
      endsOn: maintenanceDateString(record.endsOn),
      nextDueOn,
      overdue:
        record.status === 'ACTIVE' && nextDueOn !== null && nextDueOn < today,
      leadDays: record.leadDays,
      estimatedDurationMinutes: record.estimatedDurationMinutes,
      preferredStartTime: record.preferredStartTime,
      locationLabel: record.locationLabel,
      providerName: record.providerName,
      defaultCost:
        record.defaultCostMinor !== null && record.defaultCurrencyCode
          ? {
              amountMinor: record.defaultCostMinor.toString(),
              currencyCode: record.defaultCurrencyCode,
            }
          : null,
      autoCreateTask: record.autoCreateTask,
      taskCreateDaysBefore: record.taskCreateDaysBefore,
      category: record.category
        ? {
            id: record.category.id,
            name: record.category.name,
            iconKey: record.category.iconKey,
            colorToken: record.category.colorToken,
          }
        : null,
      responsible: record.responsible,
      occurrenceCount: record._count.occurrences,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      permissions: {
        canEdit: role !== 'VIEWER' && record.status !== 'ARCHIVED',
        canComplete: role !== 'VIEWER',
        canArchive: role === 'OWNER' || role === 'ADMIN',
      },
    };
  }

  public occurrence(
    record: MaintenanceOccurrenceRecord,
    role: HouseholdRole,
    documents: readonly SafeDocumentSummary[] = [],
    transactions: readonly SafeTransactionSummary[] = [],
  ) {
    return {
      id: record.id,
      plan: {
        id: record.maintenancePlan.id,
        title: record.maintenancePlan.title,
        priority: record.maintenancePlan.priority,
        status: record.maintenancePlan.status,
        category: record.maintenancePlan.category,
        responsible: record.maintenancePlan.responsible,
      },
      scheduledFor: maintenanceDateString(record.scheduledFor),
      originalScheduledFor: maintenanceDateString(record.originalScheduledFor),
      status: record.status,
      taskId: record.taskId,
      completedOn: maintenanceDateString(record.completedOn),
      completedAt: record.completedAt?.toISOString() ?? null,
      completedBy: record.completedBy,
      skippedAt: record.skippedAt?.toISOString() ?? null,
      skippedBy: record.skippedBy,
      rescheduledAt: record.rescheduledAt?.toISOString() ?? null,
      rescheduledBy: record.rescheduledBy,
      completionNotes: record.completionNotes,
      skipReason: record.skipReason,
      providerName: record.providerName,
      actualCost:
        record.actualCostMinor !== null && record.currencyCode
          ? {
              amountMinor: record.actualCostMinor.toString(),
              currencyCode: record.currencyCode,
            }
          : null,
      documents,
      transactions,
      permissions: {
        canMutate:
          role !== 'VIEWER' &&
          (record.status === 'SCHEDULED' || record.status === 'TASK_CREATED'),
      },
    };
  }
}
