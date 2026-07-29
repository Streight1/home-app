import { Inject, Injectable } from '@nestjs/common';
import {
  addIsoDateDays,
  getZonedParts,
} from '../../../common/time/zoned-date.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { TasksFacade } from '../../tasks/tasks.facade.js';
import {
  MAINTENANCE_CLOCK,
  type MaintenanceClock,
} from '../domain/maintenance-clock.port.js';
import {
  maintenanceConflict,
  maintenanceNotFound,
} from '../domain/maintenance.errors.js';
import {
  MAINTENANCE_WRITE_ROLE,
  maintenanceDateString,
} from '../domain/maintenance.types.js';
import { PrismaMaintenanceOccurrenceRepository } from '../infrastructure/prisma-maintenance-occurrence.repository.js';
import { PrismaMaintenancePlanRepository } from '../infrastructure/prisma-maintenance-plan.repository.js';

@Injectable()
export class MaintenanceTaskService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly occurrences: PrismaMaintenanceOccurrenceRepository,
    private readonly plans: PrismaMaintenancePlanRepository,
    private readonly tasks: TasksFacade,
    @Inject(MAINTENANCE_CLOCK) private readonly clock: MaintenanceClock,
  ) {}

  public async create(userId: string, occurrenceId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_WRITE_ROLE,
    );
    const occurrence = await this.occurrences.find(
      membership.householdId,
      occurrenceId,
    );
    if (!occurrence) throw maintenanceNotFound();
    if (occurrence.taskId) return { taskId: occurrence.taskId, created: false };
    if (
      occurrence.status !== 'SCHEDULED' ||
      occurrence.maintenancePlan.status !== 'ACTIVE'
    )
      throw maintenanceConflict(
        'Úkol lze vytvořit jen pro aktivní naplánovaný výskyt.',
      );
    const task = await this.tasks.createForMaintenance({
      userId,
      title: occurrence.maintenancePlan.title,
      description: 'Navázaný úkol plánu údržby domácnosti.',
      priority: occurrence.maintenancePlan.priority,
      responsibleUserId: occurrence.maintenancePlan.responsibleUserId,
      dueDate: maintenanceDateString(occurrence.scheduledFor) ?? this.today(),
      dueTimeMinutes: occurrence.maintenancePlan.preferredStartTime,
      estimatedDurationMinutes:
        occurrence.maintenancePlan.estimatedDurationMinutes,
      locationLabel: occurrence.maintenancePlan.locationLabel,
    });
    const linked = await this.occurrences.linkTask({
      householdId: membership.householdId,
      userId,
      occurrenceId,
      taskId: task.id,
    });
    if (!linked) {
      const current = await this.occurrences.find(
        membership.householdId,
        occurrenceId,
      );
      if (current?.taskId) {
        if (current.taskId !== task.id)
          await this.tasks.cancelForMaintenance(userId, task.id);
        return { taskId: current.taskId, created: false };
      }
      await this.tasks.cancelForMaintenance(userId, task.id);
      throw maintenanceConflict('Navázaný úkol se nepodařilo vytvořit.');
    }
    return { taskId: task.id, created: true };
  }

  public async createDueForPlan(userId: string, planId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_WRITE_ROLE,
    );
    const plan = await this.plans.find(membership.householdId, planId);
    if (!plan || plan.status !== 'ACTIVE' || !plan.autoCreateTask)
      return { createdCount: 0 };
    const cutoff = addIsoDateDays(this.today(), plan.taskCreateDaysBefore);
    let createdCount = 0;
    for (const occurrence of plan.occurrences) {
      const due = maintenanceDateString(occurrence.scheduledFor);
      if (
        occurrence.status !== 'SCHEDULED' ||
        occurrence.taskId ||
        !due ||
        due > cutoff
      )
        continue;
      const result = await this.create(userId, occurrence.id);
      if (result.created) createdCount += 1;
    }
    return { createdCount };
  }

  private today() {
    const parts = getZonedParts(this.clock.now(), 'Europe/Prague');
    return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  }
}
