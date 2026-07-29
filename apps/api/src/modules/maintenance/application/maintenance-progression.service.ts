import { Injectable } from '@nestjs/common';
import type { DateRecurrenceDefinition } from '../../../common/recurrence/date-recurrence.js';
import { maintenanceDateString } from '../domain/maintenance.types.js';
import { PrismaMaintenanceOccurrenceRepository } from '../infrastructure/prisma-maintenance-occurrence.repository.js';
import { PrismaMaintenancePlanRepository } from '../infrastructure/prisma-maintenance-plan.repository.js';
import { MaintenanceRecurrenceService } from './maintenance-recurrence.service.js';

@Injectable()
export class MaintenanceProgressionService {
  public constructor(
    private readonly plans: PrismaMaintenancePlanRepository,
    private readonly recurrence: MaintenanceRecurrenceService,
  ) {}

  public async advance(
    userId: string,
    householdId: string,
    occurrence: NonNullable<
      Awaited<ReturnType<PrismaMaintenanceOccurrenceRepository['find']>>
    >,
    override: string | null,
    completionDate: string,
  ) {
    const next = this.nextDate(occurrence, override, completionDate);
    if (next)
      await this.plans.generate(
        householdId,
        userId,
        occurrence.maintenancePlanId,
        [next],
      );
    await this.plans.refreshNextDueForPlan(
      householdId,
      occurrence.maintenancePlanId,
    );
    if (!next)
      await this.plans.completeWhenNoPending(
        householdId,
        userId,
        occurrence.maintenancePlanId,
      );
  }

  public nextDate(
    occurrence: NonNullable<
      Awaited<ReturnType<PrismaMaintenanceOccurrenceRepository['find']>>
    >,
    override: string | null,
    completionDate: string,
  ) {
    if (override) return override;
    const definition = occurrence.maintenancePlan
      .recurrenceDefinition as unknown as DateRecurrenceDefinition;
    const fromCompletion =
      occurrence.maintenancePlan.recurrenceBasis === 'FROM_COMPLETION_DATE';
    return this.recurrence.next({
      currentDate: fromCompletion
        ? completionDate
        : (maintenanceDateString(occurrence.originalScheduledFor) ??
          completionDate),
      startsOn: fromCompletion
        ? completionDate
        : (maintenanceDateString(occurrence.maintenancePlan.startsOn) ??
          completionDate),
      endsOn: maintenanceDateString(occurrence.maintenancePlan.endsOn),
      recurrence: definition,
    });
  }
}
