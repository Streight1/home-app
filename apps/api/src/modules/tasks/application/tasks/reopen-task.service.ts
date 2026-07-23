import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { taskConflict, taskNotFound } from '../../domain/task.errors.js';
import {
  TASK_REPOSITORY,
  type TaskRepository,
} from '../../domain/ports/task.repository.js';
import { CLOCK_PORT, type ClockPort } from '../../domain/ports/clock.port.js';
import { TASK_MUTATION_MINIMUM_ROLE } from '../../domain/task-access.policy.js';
import { MapTasksService } from '../mappers/map-tasks.service.js';

@Injectable()
export class ReopenTaskService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_REPOSITORY)
    private readonly tasks: TaskRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly responses: MapTasksService,
  ) {}

  public async execute(userId: string, taskId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_MUTATION_MINIMUM_ROLE,
    );
    const existing = await this.tasks.findById(membership.householdId, taskId);
    if (!existing) throw taskNotFound();
    if (existing.status !== 'COMPLETED')
      throw taskConflict('Znovu otevřít lze pouze dokončený úkol.');
    const task = await this.tasks.transition({
      householdId: membership.householdId,
      userId,
      taskId,
      fromStatuses: ['COMPLETED'],
      status: 'OPEN',
      completedAt: null,
      action: 'TASK_REOPENED',
    });
    if (!task) throw taskNotFound();
    return this.responses.one(userId, membership.role, this.clock.now(), task);
  }
}
