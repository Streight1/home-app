import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import type { TaskWriteInput } from '../domain/ports/task.repository.js';
import { dateOnlyDbValue } from '../domain/task-due-date.js';
import { taskWriteData } from './prisma-task.mapper.js';

@Injectable()
export class PrismaTaskWriter {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async create(input: {
    householdId: string;
    userId: string;
    task: TaskWriteInput;
  }): Promise<string> {
    const id = randomUUID();
    const { documentIds, participantUserIds, dueDate, ...task } = input.task;
    await this.prisma.$transaction(async (transaction) => {
      await transaction.task.create({
        data: {
          id,
          householdId: input.householdId,
          createdByUserId: input.userId,
          updatedByUserId: input.userId,
          ...task,
          dueDate: dueDate ? dateOnlyDbValue(dueDate) : null,
        },
      });
      await transaction.taskParticipant.createMany({
        data: participantUserIds.map((participantUserId) => ({
          taskId: id,
          userId: participantUserId,
          addedByUserId: input.userId,
        })),
      });
      if (documentIds.length > 0) {
        await transaction.taskDocument.createMany({
          data: documentIds.map((documentId) => ({
            taskId: id,
            documentId,
            createdByUserId: input.userId,
          })),
        });
      }
      await this.audit.record(transaction, {
        action: 'TASK_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Task',
        entityId: id,
        metadata: { taskId: id, documentCount: documentIds.length },
      });
    });
    return id;
  }

  public async update(input: {
    householdId: string;
    userId: string;
    taskId: string;
    task: Partial<TaskWriteInput>;
    changedFields: readonly string[];
  }): Promise<boolean> {
    const { documentIds, participantUserIds, ...task } = input.task;
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.task.updateMany({
        where: { id: input.taskId, householdId: input.householdId },
        data: { ...taskWriteData(task), updatedByUserId: input.userId },
      });
      if (result.count === 0) return false;
      if (participantUserIds !== undefined) {
        await transaction.taskParticipant.deleteMany({
          where: { taskId: input.taskId },
        });
        await transaction.taskParticipant.createMany({
          data: participantUserIds.map((participantUserId) => ({
            taskId: input.taskId,
            userId: participantUserId,
            addedByUserId: input.userId,
          })),
        });
      }
      if (documentIds !== undefined) {
        await transaction.taskDocument.deleteMany({
          where: { taskId: input.taskId },
        });
        if (documentIds.length > 0) {
          await transaction.taskDocument.createMany({
            data: documentIds.map((documentId) => ({
              taskId: input.taskId,
              documentId,
              createdByUserId: input.userId,
            })),
          });
        }
      }
      await this.audit.record(transaction, {
        action: 'TASK_UPDATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Task',
        entityId: input.taskId,
        metadata: { taskId: input.taskId, changedFields: input.changedFields },
      });
      if (documentIds !== undefined) {
        await this.audit.record(transaction, {
          action: 'TASK_DOCUMENTS_CHANGED',
          householdId: input.householdId,
          userId: input.userId,
          entityType: 'Task',
          entityId: input.taskId,
          metadata: { taskId: input.taskId, documentCount: documentIds.length },
        });
      }
      return true;
    });
  }

  public async complete(input: {
    householdId: string;
    userId: string;
    taskId: string;
    completedAt: Date;
    note: string | null;
    nextDueDate: string | null;
    nextDueTimeMinutes: number | null;
    nextDueAt: Date | null;
    remainsOpen: boolean;
  }): Promise<boolean> {
    return this.prisma.$transaction((transaction) =>
      this.completeInTransaction(transaction, input),
    );
  }

  public async completeInTransaction(
    transaction: Prisma.TransactionClient,
    input: {
      householdId: string;
      userId: string;
      taskId: string;
      completedAt: Date;
      note: string | null;
      nextDueDate: string | null;
      nextDueTimeMinutes: number | null;
      nextDueAt: Date | null;
      remainsOpen: boolean;
    },
  ): Promise<boolean> {
    const task = await transaction.task.findFirst({
      where: {
        id: input.taskId,
        householdId: input.householdId,
        status: 'OPEN',
      },
    });
    if (!task) return false;
    await transaction.taskCompletion.create({
      data: {
        taskId: task.id,
        householdId: input.householdId,
        completedByUserId: input.userId,
        occurrenceDueDate: task.dueDate,
        occurrenceDueTimeMinutes: task.dueTimeMinutes,
        occurrenceDueAt: task.dueAt,
        completedAt: input.completedAt,
        note: input.note,
      },
    });
    await transaction.task.update({
      where: { id: task.id },
      data: input.remainsOpen
        ? {
            status: 'OPEN',
            dueDate: input.nextDueDate
              ? dateOnlyDbValue(input.nextDueDate)
              : null,
            dueTimeMinutes: input.nextDueTimeMinutes,
            dueAt: input.nextDueAt,
            isAllDay:
              input.nextDueDate !== null && input.nextDueTimeMinutes === null,
            nextOccurrenceAt: input.nextDueAt,
            completedAt: null,
            updatedByUserId: input.userId,
          }
        : {
            status: 'COMPLETED',
            completedAt: input.completedAt,
            nextOccurrenceAt: null,
            updatedByUserId: input.userId,
          },
    });
    await this.audit.record(transaction, {
      action: 'TASK_COMPLETED',
      householdId: input.householdId,
      userId: input.userId,
      entityType: 'Task',
      entityId: task.id,
      metadata: {
        taskId: task.id,
        previousStatus: 'OPEN',
        newStatus: input.remainsOpen ? 'OPEN' : 'COMPLETED',
      },
    });
    return true;
  }

  public async transition(input: {
    householdId: string;
    userId: string;
    taskId: string;
    fromStatuses: readonly ('OPEN' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED')[];
    status: 'OPEN' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
    completedAt?: Date | null;
    cancelledAt?: Date | null;
    archivedAt?: Date | null;
    action: 'TASK_REOPENED' | 'TASK_CANCELLED' | 'TASK_ARCHIVED';
  }): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.task.updateMany({
        where: {
          id: input.taskId,
          householdId: input.householdId,
          status: { in: [...input.fromStatuses] },
        },
        data: {
          status: input.status,
          updatedByUserId: input.userId,
          ...(input.completedAt !== undefined
            ? { completedAt: input.completedAt }
            : {}),
          ...(input.cancelledAt !== undefined
            ? { cancelledAt: input.cancelledAt }
            : {}),
          ...(input.archivedAt !== undefined
            ? { archivedAt: input.archivedAt }
            : {}),
        },
      });
      if (updated.count === 0) return false;
      await this.audit.record(transaction, {
        action: input.action,
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'Task',
        entityId: input.taskId,
        metadata: { taskId: input.taskId, newStatus: input.status },
      });
      return true;
    });
  }
}
