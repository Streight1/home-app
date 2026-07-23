import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../households/household-access.service.js';
import {
  TASK_REPOSITORY,
  type TaskRepository,
} from './domain/ports/task.repository.js';
import { taskNotFound, invalidTaskInput } from './domain/task.errors.js';
import { dueInstant } from './domain/task-due-date.js';

@Injectable()
export class TasksFacade {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_REPOSITORY)
    private readonly tasks: TaskRepository,
  ) {}

  public async calendarFeed(
    userId: string,
    householdId: string,
    from: Date,
    to: Date,
  ) {
    const membership = await this.access.assertMembership(userId, householdId);
    const tasks = await this.tasks.calendarFeed({ householdId, from, to });
    return tasks
      .map((task) => {
        const start =
          task.dueAt ??
          (task.dueDate ? dueInstant(task.dueDate, 0, task.timezone) : null);
        if (!start || start < from || start >= to) return null;
        return {
          id: task.id,
          title: task.title,
          start: start.toISOString(),
          end: null,
          status: task.status,
          priority: task.priority,
          isAllDay: task.dueTimeMinutes === null,
          canComplete: membership.role !== 'VIEWER',
          navigationTarget: {
            area: 'tasks' as const,
            screen: 'detail' as const,
            taskId: task.id,
          },
        };
      })
      .filter((task) => task !== null);
  }

  public async getSchedulingSummary(userId: string, taskId: string) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const task = await this.tasks.findById(membership.householdId, taskId);
    if (!task) throw taskNotFound();
    if (task.recurrenceFrequency !== 'NONE')
      throw invalidTaskInput(
        'Opakovaný úkol zatím nelze bezpečně naplánovat do kalendáře.',
      );
    if (!task.estimatedDurationMinutes)
      throw invalidTaskInput('Nejprve doplňte předpokládanou délku úkolu.');
    if (task.participants.length === 0)
      throw invalidTaskInput('Nejprve vyberte alespoň jednoho účastníka.');
    return {
      id: task.id,
      householdId: task.householdId,
      title: task.title,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      participants: task.participants.map((participant) => ({
        userId: participant.id,
        displayName: participant.displayName,
        avatarUrl: participant.avatarUrl,
      })),
      location:
        task.locationPlaceId && task.locationLabel
          ? {
              placeId: task.locationPlaceId,
              label: task.locationLabel,
              routable: true,
            }
          : task.locationLabel
            ? { placeId: null, label: task.locationLabel, routable: false }
            : null,
      version: task.updatedAt.toISOString(),
    };
  }

  public async getOwnershipSummary(userId: string, taskId: string) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const task = await this.tasks.findById(membership.householdId, taskId);
    if (!task) throw taskNotFound();
    return { id: task.id, householdId: task.householdId };
  }
}
