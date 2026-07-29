import { Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../households/household-access.service.js';
import { maintenanceNotFound } from './domain/maintenance.errors.js';
import { maintenanceDateString } from './domain/maintenance.types.js';
import { PrismaMaintenanceLinkRepository } from './infrastructure/prisma-maintenance-link.repository.js';
import { PrismaMaintenanceOccurrenceRepository } from './infrastructure/prisma-maintenance-occurrence.repository.js';
import { PrismaMaintenancePlanRepository } from './infrastructure/prisma-maintenance-plan.repository.js';

@Injectable()
export class MaintenanceFacade {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly plans: PrismaMaintenancePlanRepository,
    private readonly occurrences: PrismaMaintenanceOccurrenceRepository,
    private readonly links: PrismaMaintenanceLinkRepository,
  ) {}

  public async getPlanSummary(userId: string, planId: string) {
    const membership = await this.access.getActiveMembership(userId);
    const plan = await this.plans.find(membership.householdId, planId);
    if (!plan) throw maintenanceNotFound();
    return {
      id: plan.id,
      householdId: plan.householdId,
      title: plan.title,
      status: plan.status,
      nextDueOn: maintenanceDateString(plan.nextDueOn),
      responsibleUserId: plan.responsibleUserId,
    };
  }

  public async getOccurrenceSummary(userId: string, occurrenceId: string) {
    const membership = await this.access.getActiveMembership(userId);
    const occurrence = await this.occurrences.find(
      membership.householdId,
      occurrenceId,
    );
    if (!occurrence) throw maintenanceNotFound();
    return {
      id: occurrence.id,
      householdId: occurrence.householdId,
      planId: occurrence.maintenancePlanId,
      scheduledFor: maintenanceDateString(occurrence.scheduledFor),
      status: occurrence.status,
      taskId: occurrence.taskId,
    };
  }

  public async getTaskContext(userId: string, taskId: string) {
    const membership = await this.access.getActiveMembership(userId);
    const link = await this.links.findTaskContext(
      membership.householdId,
      taskId,
    );
    if (!link) throw maintenanceNotFound();
    const occurrence = link.maintenanceOccurrence;
    return {
      occurrenceId: occurrence.id,
      planId: occurrence.maintenancePlan.id,
      planTitle: occurrence.maintenancePlan.title,
      planStatus: occurrence.maintenancePlan.status,
      occurrenceStatus: occurrence.status,
      scheduledFor: maintenanceDateString(occurrence.scheduledFor),
      permissions: {
        canComplete:
          membership.role !== 'VIEWER' &&
          ['SCHEDULED', 'TASK_CREATED'].includes(occurrence.status),
      },
      navigationTarget: {
        area: 'maintenance' as const,
        screen: 'plan' as const,
        planId: occurrence.maintenancePlan.id,
      },
    };
  }
}
