import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { taskConflict, taskNotFound } from '../../domain/task.errors.js';
import {
  TASK_REPOSITORY,
  type TaskRepository,
} from '../../domain/ports/task.repository.js';
import { CLOCK_PORT, type ClockPort } from '../../domain/ports/clock.port.js';
import { TASK_MUTATION_MINIMUM_ROLE } from '../../domain/task-access.policy.js';
import type { CompleteTaskDto } from '../../presentation/dto/complete-task.dto.js';
import { localIsoDate } from '../../domain/task-due-date.js';
import { MapTasksService } from '../mappers/map-tasks.service.js';
import { CalculateNextOccurrenceService } from '../recurrence/calculate-next-occurrence.service.js';

@Injectable()
export class CompleteTaskService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_REPOSITORY)
    private readonly tasks: TaskRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly calculateNext: CalculateNextOccurrenceService,
    private readonly responses: MapTasksService,
  ) {}

  public async previewNext(userId: string, taskId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_MUTATION_MINIMUM_ROLE,
    );
    const task = await this.tasks.findById(membership.householdId, taskId);
    if (!task) throw taskNotFound();
    const next = this.next(task);
    return next?.dueAt?.toISOString() ?? next?.dueDate ?? null;
  }

  public async execute(userId: string, taskId: string, input: CompleteTaskDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_MUTATION_MINIMUM_ROLE,
    );
    const task = await this.tasks.findById(membership.householdId, taskId);
    if (!task) throw taskNotFound();
    if (task.status !== 'OPEN')
      throw taskConflict('Dokončit lze pouze otevřený úkol.');
    const now = this.clock.now();
    const next = this.next(task);
    const remainsOpen = task.recurrenceFrequency !== 'NONE' && next !== null;
    const completed = await this.tasks.complete({
      householdId: membership.householdId,
      userId,
      taskId,
      completedAt: now,
      note: input.note ?? null,
      nextDueDate: next?.dueDate ?? null,
      nextDueTimeMinutes: next?.dueTimeMinutes ?? null,
      nextDueAt: next?.dueAt ?? null,
      remainsOpen,
    });
    if (!completed) throw taskNotFound();
    return this.responses.one(userId, membership.role, now, completed);
  }

  private next(task: Awaited<ReturnType<TaskRepository['findById']>>) {
    if (!task || task.recurrenceFrequency === 'NONE' || !task.dueDate)
      return null;
    const rule = {
      frequency: task.recurrenceFrequency,
      interval: task.recurrenceInterval,
      daysOfWeek: task.recurrenceDaysOfWeek,
      dayOfMonth: task.recurrenceDayOfMonth,
      monthOfYear: task.recurrenceMonthOfYear,
      endsAt: task.recurrenceEndsAt,
    };
    if (task.dueTimeMinutes === null) {
      const dueDate = this.calculateNext.executeDateOnly({
        currentDueDate: task.dueDate,
        timezone: task.timezone,
        rule,
      });
      return dueDate ? { dueDate, dueTimeMinutes: null, dueAt: null } : null;
    }
    if (!task.dueAt) return null;
    const dueAt = this.calculateNext.execute({
      currentDueAt: task.dueAt,
      timezone: task.timezone,
      rule,
    });
    return dueAt
      ? {
          dueDate: localIsoDate(dueAt, task.timezone),
          dueTimeMinutes: task.dueTimeMinutes,
          dueAt,
        }
      : null;
  }
}
