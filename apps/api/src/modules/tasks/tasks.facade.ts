import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { HouseholdAccessService } from '../households/household-access.service.js';
import {
  TASK_REPOSITORY,
  type TaskRepository,
} from './domain/ports/task.repository.js';
import {
  invalidTaskInput,
  taskConflict,
  taskNotFound,
} from './domain/task.errors.js';
import { dueInstant } from './domain/task-due-date.js';
import { CreateTaskService } from './application/tasks/create-task.service.js';
import { CompleteTaskService } from './application/tasks/complete-task.service.js';
import { UpdateTaskService } from './application/tasks/update-task.service.js';
import { CancelTaskService } from './application/tasks/cancel-task.service.js';
import { PrismaTaskWriter } from './infrastructure/prisma-task.writer.js';

@Injectable()
export class TasksFacade {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_REPOSITORY)
    private readonly tasks: TaskRepository,
    private readonly createTask: CreateTaskService,
    private readonly completeTask: CompleteTaskService,
    private readonly updateTask: UpdateTaskService,
    private readonly cancelTask: CancelTaskService,
    private readonly taskWriter: PrismaTaskWriter,
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

  public async createForMaintenance(input: {
    userId: string;
    title: string;
    description: string | null;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    responsibleUserId: string | null;
    dueDate: string;
    dueTimeMinutes: number | null;
    estimatedDurationMinutes: number | null;
    locationLabel: string | null;
  }): Promise<{ id: string }> {
    const task = await this.createTask.execute(input.userId, {
      title: input.title,
      description: input.description,
      priority: input.priority,
      assignedToUserId: input.responsibleUserId,
      participantUserIds: [input.responsibleUserId ?? input.userId],
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      locationLabel: input.locationLabel,
      locationNotes: null,
      dueDate: input.dueDate,
      dueTimeMinutes: input.dueTimeMinutes,
      timezone: 'Europe/Prague',
      recurrenceFrequency: 'NONE',
      recurrenceInterval: 1,
      recurrenceDaysOfWeek: [],
      documentIds: [],
    });
    return { id: task.id };
  }

  public async completeForMaintenance(
    userId: string,
    taskId: string,
  ): Promise<void> {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const task = await this.tasks.findById(membership.householdId, taskId);
    if (!task) throw taskNotFound();
    if (task.status === 'COMPLETED') return;
    await this.completeTask.execute(userId, taskId, {});
  }

  public async completeForMaintenanceInTransaction(
    userId: string,
    taskId: string,
    completedAt: Date,
    transaction: Prisma.TransactionClient,
  ): Promise<void> {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const task = await this.tasks.findById(membership.householdId, taskId);
    if (!task) throw taskNotFound();
    if (task.status === 'COMPLETED') return;
    if (task.status !== 'OPEN')
      throw taskConflict('Navázaný úkol již nelze dokončit.');
    const completed = await this.taskWriter.completeInTransaction(transaction, {
      householdId: membership.householdId,
      userId,
      taskId,
      completedAt,
      note: null,
      nextDueDate: null,
      nextDueTimeMinutes: null,
      nextDueAt: null,
      remainsOpen: false,
    });
    if (completed) return;
    const current = await transaction.task.findFirst({
      where: { id: taskId, householdId: membership.householdId },
      select: { status: true },
    });
    if (current?.status !== 'COMPLETED')
      throw taskConflict('Navázaný úkol se nepodařilo dokončit.');
  }

  public async rescheduleForMaintenance(
    userId: string,
    taskId: string,
    dueDate: string,
    dueTimeMinutes: number | null,
  ): Promise<void> {
    await this.updateTask.execute(userId, taskId, {
      dueDate,
      dueTimeMinutes,
    });
  }

  public async cancelForMaintenance(
    userId: string,
    taskId: string,
  ): Promise<void> {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const task = await this.tasks.findById(membership.householdId, taskId);
    if (!task) throw taskNotFound();
    if (task.status === 'CANCELLED') return;
    if (task.status !== 'OPEN') return;
    await this.cancelTask.execute(userId, taskId);
  }
}
