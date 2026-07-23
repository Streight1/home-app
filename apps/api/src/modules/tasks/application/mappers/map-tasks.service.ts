import { Injectable } from '@nestjs/common';
import { DocumentsFacade } from '../../../documents/documents.facade.js';
import type { HouseholdRole } from '../../../households/household.types.js';
import type { TaskRecord } from '../../domain/ports/task.repository.js';
import { TaskResponseMapper } from './task-response.mapper.js';
import { CalculateNextOccurrenceService } from '../recurrence/calculate-next-occurrence.service.js';

@Injectable()
export class MapTasksService {
  public constructor(
    private readonly documents: DocumentsFacade,
    private readonly mapper: TaskResponseMapper,
    private readonly calculateNext: CalculateNextOccurrenceService,
  ) {}

  public async one(
    userId: string,
    role: HouseholdRole,
    now: Date,
    task: TaskRecord,
  ) {
    const documents = await this.documents.verifyAccessibleSummaries(
      userId,
      task.documentIds,
    );
    return this.map(task, role, now, documents);
  }

  public async many(
    userId: string,
    role: HouseholdRole,
    now: Date,
    tasks: readonly TaskRecord[],
  ) {
    const ids = [...new Set(tasks.flatMap((task) => task.documentIds))];
    const documents = await this.documents.verifyAccessibleSummaries(
      userId,
      ids,
    );
    const byId = new Map(documents.map((document) => [document.id, document]));
    return tasks.map((task) =>
      this.map(
        task,
        role,
        now,
        task.documentIds.flatMap((id) => {
          const document = byId.get(id);
          return document ? [document] : [];
        }),
      ),
    );
  }

  private map(
    task: TaskRecord,
    role: HouseholdRole,
    now: Date,
    documents: Parameters<TaskResponseMapper['map']>[3],
  ) {
    const response = this.mapper.map(task, role, now, documents);
    const rule = {
      frequency: task.recurrenceFrequency,
      interval: task.recurrenceInterval,
      daysOfWeek: task.recurrenceDaysOfWeek,
      dayOfMonth: task.recurrenceDayOfMonth,
      monthOfYear: task.recurrenceMonthOfYear,
      endsAt: task.recurrenceEndsAt,
    };
    const nextAt =
      task.dueAt &&
      task.dueTimeMinutes !== null &&
      task.recurrenceFrequency !== 'NONE'
        ? this.calculateNext.execute({
            currentDueAt: task.dueAt,
            timezone: task.timezone,
            rule,
          })
        : null;
    const nextDate =
      task.dueDate &&
      task.dueTimeMinutes === null &&
      task.recurrenceFrequency !== 'NONE'
        ? this.calculateNext.executeDateOnly({
            currentDueDate: task.dueDate,
            timezone: task.timezone,
            rule,
          })
        : null;
    return {
      ...response,
      recurrence: {
        ...response.recurrence,
        nextOccurrenceDate: nextDate,
        nextOccurrenceAt: nextAt?.toISOString() ?? null,
      },
    };
  }
}
