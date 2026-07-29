import type { Prisma } from '../../../generated/prisma/client.js';
import type { AuditService } from '../../audit/audit.service.js';
import { maintenanceDate } from '../domain/maintenance.types.js';

export async function advanceCompletedMaintenancePlan(
  transaction: Prisma.TransactionClient,
  audit: AuditService,
  input: {
    householdId: string;
    userId: string;
    occurrenceId: string;
    nextOccurrenceDate: string | null;
  },
) {
  const completed = await transaction.maintenanceOccurrence.findUnique({
    where: { id: input.occurrenceId },
    select: { maintenancePlanId: true },
  });
  if (!completed) return;
  if (input.nextOccurrenceDate) {
    const created = await transaction.maintenanceOccurrence.createManyAndReturn(
      {
        data: [
          {
            householdId: input.householdId,
            maintenancePlanId: completed.maintenancePlanId,
            scheduledFor: maintenanceDate(input.nextOccurrenceDate),
            originalScheduledFor: maintenanceDate(input.nextOccurrenceDate),
          },
        ],
        skipDuplicates: true,
        select: { id: true },
      },
    );
    for (const occurrence of created)
      await audit.record(transaction, {
        action: 'MAINTENANCE_OCCURRENCE_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'MaintenanceOccurrence',
        entityId: occurrence.id,
        metadata: {
          planId: completed.maintenancePlanId,
          occurrenceId: occurrence.id,
        },
      });
  }
  const next = await transaction.maintenanceOccurrence.findFirst({
    where: {
      householdId: input.householdId,
      maintenancePlanId: completed.maintenancePlanId,
      status: { in: ['SCHEDULED', 'TASK_CREATED'] },
    },
    orderBy: [{ scheduledFor: 'asc' }, { id: 'asc' }],
    select: { scheduledFor: true },
  });
  await transaction.maintenancePlan.updateMany({
    where: {
      id: completed.maintenancePlanId,
      householdId: input.householdId,
    },
    data: next
      ? { nextDueOn: next.scheduledFor }
      : {
          nextDueOn: null,
          status: 'COMPLETED',
          updatedByUserId: input.userId,
        },
  });
}
