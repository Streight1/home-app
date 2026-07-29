import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { maintenanceDate } from '../domain/maintenance.types.js';
import { maintenancePlanListInclude } from './prisma-maintenance-plan.repository.js';

@Injectable()
export class PrismaMaintenanceDashboardRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async get(
    householdId: string,
    today: string,
    inSevenDays: string,
    inThirtyDays: string,
  ) {
    const todayDate = maintenanceDate(today);
    const sevenDate = maintenanceDate(inSevenDays);
    const thirtyDate = maintenanceDate(inThirtyDays);
    const active = { householdId, status: 'ACTIVE' as const };
    const [
      overdueTotal,
      dueTodayTotal,
      dueWithinSevenDaysTotal,
      dueWithinThirtyDaysTotal,
      pausedTotal,
      upcoming,
      recentCompletion,
    ] = await Promise.all([
      this.prisma.maintenancePlan.count({
        where: { ...active, nextDueOn: { lt: todayDate } },
      }),
      this.prisma.maintenancePlan.count({
        where: { ...active, nextDueOn: todayDate },
      }),
      this.prisma.maintenancePlan.count({
        where: { ...active, nextDueOn: { gte: todayDate, lte: sevenDate } },
      }),
      this.prisma.maintenancePlan.count({
        where: { ...active, nextDueOn: { gte: todayDate, lte: thirtyDate } },
      }),
      this.prisma.maintenancePlan.count({
        where: { householdId, status: 'PAUSED' },
      }),
      this.prisma.maintenancePlan.findMany({
        where: { ...active, nextDueOn: { not: null } },
        include: maintenancePlanListInclude,
        orderBy: [{ nextDueOn: 'asc' }, { priority: 'desc' }, { id: 'asc' }],
        take: 5,
      }),
      this.prisma.maintenanceOccurrence.findFirst({
        where: { householdId, status: 'COMPLETED' },
        include: {
          maintenancePlan: { select: { id: true, title: true } },
          completedBy: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
        orderBy: [{ completedAt: 'desc' }, { id: 'asc' }],
      }),
    ]);
    return {
      summary: {
        overdueTotal,
        dueTodayTotal,
        dueWithinSevenDaysTotal,
        dueWithinThirtyDaysTotal,
        pausedTotal,
      },
      upcoming,
      recentCompletion,
    };
  }
}
