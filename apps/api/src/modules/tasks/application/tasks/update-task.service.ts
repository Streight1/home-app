import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  taskConflict,
  taskNotFound,
  invalidTaskInput,
} from '../../domain/task.errors.js';
import {
  TASK_REPOSITORY,
  type TaskRepository,
} from '../../domain/ports/task.repository.js';
import { CLOCK_PORT, type ClockPort } from '../../domain/ports/clock.port.js';
import { TASK_MUTATION_MINIMUM_ROLE } from '../../domain/task-access.policy.js';
import type { UpdateTaskDto } from '../../presentation/dto/update-task.dto.js';
import { MapTasksService } from '../mappers/map-tasks.service.js';
import { TaskWriteValidationService } from './task-write-validation.service.js';

@Injectable()
export class UpdateTaskService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_REPOSITORY)
    private readonly tasks: TaskRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly validation: TaskWriteValidationService,
    private readonly responses: MapTasksService,
  ) {}

  public async execute(userId: string, taskId: string, input: UpdateTaskDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_MUTATION_MINIMUM_ROLE,
    );
    const existing = await this.tasks.findById(membership.householdId, taskId);
    if (!existing) throw taskNotFound();
    if (existing.status === 'ARCHIVED')
      throw taskConflict('Archivovaný úkol nelze upravovat.');
    const changedFields = Object.keys(input);
    if (changedFields.length === 0)
      throw invalidTaskInput('Vyplňte alespoň jednu změnu.');
    const updated = await this.tasks.update({
      householdId: membership.householdId,
      userId,
      taskId,
      task: await this.validation.update(
        userId,
        membership.householdId,
        input,
        existing,
      ),
      changedFields,
    });
    if (!updated) throw taskNotFound();
    return this.responses.one(
      userId,
      membership.role,
      this.clock.now(),
      updated,
    );
  }
}
