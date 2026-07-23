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
import { TaskDashboardResponseMapper } from './task-dashboard-response.mapper.js';

@Injectable()
export class GetTaskDashboardService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_REPOSITORY)
    private readonly tasks: TaskRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly mapper: TaskDashboardResponseMapper,
  ) {}

  public async execute(userId: string, timezone: string) {
    if (!isValidTimezone(timezone))
      throw invalidTaskInput('Časové pásmo není platné.');
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_READ_MINIMUM_ROLE,
    );
    const now = this.clock.now();
    const result = await this.tasks.dashboard({
      householdId: membership.householdId,
      now,
      timezone,
      limit: 7,
    });
    return {
      summary: {
        openTotal: result.openTotal,
        overdueTotal: result.overdueTotal,
        dueTodayTotal: result.dueTodayTotal,
        upcomingTotal: result.upcomingTotal,
      },
      items: result.items.map((task) =>
        this.mapper.map(task, membership.role, now),
      ),
    };
  }
}
