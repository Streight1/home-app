import { Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  MAINTENANCE_READ_ROLE,
  maintenanceDateString,
} from '../domain/maintenance.types.js';
import { PrismaMaintenanceDashboardRepository } from '../infrastructure/prisma-maintenance-dashboard.repository.js';
import { MaintenancePlansService } from './maintenance-plans.service.js';
import { MaintenanceResponseMapper } from './maintenance-response.mapper.js';

@Injectable()
export class MaintenanceDashboardService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly dashboard: PrismaMaintenanceDashboardRepository,
    private readonly planService: MaintenancePlansService,
    private readonly responses: MaintenanceResponseMapper,
  ) {}

  public async get(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_READ_ROLE,
    );
    const range = this.planService.rangeDates();
    const result = await this.dashboard.get(
      membership.householdId,
      range.today,
      range.inSevenDays,
      range.inThirtyDays,
    );
    return {
      summary: result.summary,
      items: result.upcoming.map((plan) => {
        const mapped = this.responses.plan(plan, membership.role, range.today);
        return {
          id: mapped.id,
          title: mapped.title,
          nextDueOn: mapped.nextDueOn,
          priority: mapped.priority,
          overdue: mapped.overdue,
          category: mapped.category,
          responsible: mapped.responsible,
          permissions: {
            canComplete: membership.role !== 'VIEWER',
          },
          navigationTarget: {
            area: 'maintenance' as const,
            screen: 'plans' as const,
          },
        };
      }),
      recentlyCompleted: result.recentCompletion
        ? {
            occurrenceId: result.recentCompletion.id,
            planId: result.recentCompletion.maintenancePlan.id,
            title: result.recentCompletion.maintenancePlan.title,
            completedOn: maintenanceDateString(
              result.recentCompletion.completedOn,
            ),
            completedAt:
              result.recentCompletion.completedAt?.toISOString() ?? null,
            completedBy: result.recentCompletion.completedBy,
          }
        : null,
    };
  }
}
