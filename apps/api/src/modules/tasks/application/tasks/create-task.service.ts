import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { TASK_MUTATION_MINIMUM_ROLE } from '../../domain/task-access.policy.js';
import {
  TASK_REPOSITORY,
  type TaskRepository,
} from '../../domain/ports/task.repository.js';
import type { ClockPort } from '../../domain/ports/clock.port.js';
import { CLOCK_PORT } from '../../domain/ports/clock.port.js';
import type { CreateTaskDto } from '../../presentation/dto/create-task.dto.js';
import { MapTasksService } from '../mappers/map-tasks.service.js';
import { TaskWriteValidationService } from './task-write-validation.service.js';

@Injectable()
export class CreateTaskService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_REPOSITORY)
    private readonly tasks: TaskRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly validation: TaskWriteValidationService,
    private readonly responses: MapTasksService,
  ) {}

  public async execute(userId: string, input: CreateTaskDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_MUTATION_MINIMUM_ROLE,
    );
    const task = await this.tasks.create({
      householdId: membership.householdId,
      userId,
      task: await this.validation.create(userId, membership.householdId, input),
    });
    return this.responses.one(userId, membership.role, this.clock.now(), task);
  }
}
