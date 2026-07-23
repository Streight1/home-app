import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { invalidTaskInput } from '../../domain/task.errors.js';
import {
  TASK_REPOSITORY,
  type TaskRepository,
} from '../../domain/ports/task.repository.js';
import { CLOCK_PORT, type ClockPort } from '../../domain/ports/clock.port.js';
import { TASK_READ_MINIMUM_ROLE } from '../../domain/task-access.policy.js';
import { isValidTimezone } from '../../domain/zoned-date.js';
import { MapTasksService } from '../mappers/map-tasks.service.js';

@Injectable()
export class GetTaskAttentionService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_REPOSITORY)
    private readonly tasks: TaskRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly responses: MapTasksService,
  ) {}

  public async execute(userId: string, timezone: string) {
    if (!isValidTimezone(timezone))
      throw invalidTaskInput('Časové pásmo není platné.');
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_READ_MINIMUM_ROLE,
    );
    const now = this.clock.now();
    const result = await this.tasks.attention({
      householdId: membership.householdId,
      now,
      timezone,
      limit: 5,
    });
    return {
      todayCount: result.todayCount,
      overdueCount: result.overdueCount,
      items: await this.responses.many(
        userId,
        membership.role,
        now,
        result.items,
      ),
      permissions: { canComplete: membership.role !== 'VIEWER' },
    };
  }
}
