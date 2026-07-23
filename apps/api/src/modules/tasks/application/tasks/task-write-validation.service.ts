import { Inject, Injectable } from '@nestjs/common';
import { DocumentsFacade } from '../../../documents/documents.facade.js';
import { LocationFacade } from '../../../location/location.facade.js';
import {
  taskCategoryNotFound,
  invalidTaskInput,
} from '../../domain/task.errors.js';
import type {
  TaskRecord,
  TaskWriteInput,
  TaskRepository,
} from '../../domain/ports/task.repository.js';
import { TASK_REPOSITORY } from '../../domain/ports/task.repository.js';
import {
  TASK_CATEGORY_REPOSITORY,
  type TaskCategoryRepository,
} from '../../domain/ports/task-category.repository.js';
import type { CreateTaskDto } from '../../presentation/dto/create-task.dto.js';
import type { UpdateTaskDto } from '../../presentation/dto/update-task.dto.js';
import { ResolveTaskScheduleService } from './resolve-task-schedule.service.js';

type TaskInput = CreateTaskDto | UpdateTaskDto;

@Injectable()
export class TaskWriteValidationService {
  public constructor(
    @Inject(TASK_REPOSITORY)
    private readonly tasks: TaskRepository,
    @Inject(TASK_CATEGORY_REPOSITORY)
    private readonly categories: TaskCategoryRepository,
    private readonly documents: DocumentsFacade,
    private readonly locations: LocationFacade,
    private readonly schedule: ResolveTaskScheduleService,
  ) {}

  public async create(
    userId: string,
    householdId: string,
    input: CreateTaskDto,
  ): Promise<TaskWriteInput> {
    return this.build(userId, householdId, input);
  }

  public async update(
    userId: string,
    householdId: string,
    input: UpdateTaskDto,
    existing: TaskRecord,
  ): Promise<Partial<TaskWriteInput>> {
    const complete = await this.build(userId, householdId, input, existing);
    const keys = new Set<keyof TaskWriteInput>(
      Object.keys(input) as (keyof TaskWriteInput)[],
    );
    const recurrenceChanged = [...keys].some((key) =>
      key.startsWith('recurrence'),
    );
    if (
      recurrenceChanged ||
      keys.has('dueDate') ||
      keys.has('dueTimeMinutes') ||
      keys.has('timezone')
    ) {
      keys.add('dueDate');
      keys.add('dueTimeMinutes');
      keys.add('dueAt');
      keys.add('isAllDay');
      keys.add('recurrenceFrequency');
      keys.add('recurrenceInterval');
      keys.add('recurrenceDaysOfWeek');
      keys.add('recurrenceDayOfMonth');
      keys.add('recurrenceMonthOfYear');
      keys.add('recurrenceEndsAt');
      keys.add('nextOccurrenceAt');
    }
    return Object.fromEntries(
      [...keys].map((key) => [key, complete[key]]),
    ) as Partial<TaskWriteInput>;
  }

  private async build(
    userId: string,
    householdId: string,
    input: TaskInput,
    existing?: TaskRecord,
  ): Promise<TaskWriteInput> {
    const participantUserIds = [
      ...new Set(
        input.participantUserIds ??
          (input.assignedToUserId
            ? [input.assignedToUserId]
            : existing?.participantUserIds.length
              ? existing.participantUserIds
              : existing?.assignedToUserId
                ? [existing.assignedToUserId]
                : [userId]),
      ),
    ];
    if (participantUserIds.length === 0)
      throw invalidTaskInput('Vyberte alespoň jednoho účastníka úkolu.');
    const memberChecks = await Promise.all(
      participantUserIds.map((participantId) =>
        this.tasks.isActiveMember(householdId, participantId),
      ),
    );
    if (memberChecks.some((active) => !active))
      throw invalidTaskInput(
        'Účastníkem může být pouze aktivní člen domácnosti.',
      );
    const assignedToUserId = participantUserIds[0] ?? null;
    const categoryId =
      input.categoryId !== undefined
        ? input.categoryId
        : (existing?.categoryId ?? null);
    if (
      categoryId &&
      !(await this.categories.findById(householdId, categoryId))
    )
      throw taskCategoryNotFound();
    const documentIds = input.documentIds ?? existing?.documentIds ?? [];
    await this.documents.verifyAccessibleSummaries(userId, documentIds);
    const locationPlaceId =
      input.locationPlaceId !== undefined
        ? input.locationPlaceId
        : (existing?.locationPlaceId ?? null);
    const accessiblePlace = locationPlaceId
      ? await this.locations.findAccessiblePlace(
          householdId,
          userId,
          locationPlaceId,
        )
      : null;
    if (locationPlaceId && !accessiblePlace)
      throw invalidTaskInput('Vybrané místo není v této domácnosti dostupné.');
    const schedule = this.schedule.execute(input, existing);
    return {
      title: input.title ?? existing?.title ?? '',
      description:
        input.description !== undefined
          ? input.description
          : (existing?.description ?? null),
      priority: input.priority ?? existing?.priority ?? 'NORMAL',
      assignedToUserId,
      participantUserIds,
      estimatedDurationMinutes:
        input.estimatedDurationMinutes !== undefined
          ? input.estimatedDurationMinutes
          : (existing?.estimatedDurationMinutes ?? null),
      locationPlaceId,
      locationLabel:
        input.locationLabel !== undefined
          ? input.locationLabel
          : (accessiblePlace?.label ?? existing?.locationLabel ?? null),
      locationNotes:
        input.locationNotes !== undefined
          ? input.locationNotes
          : (existing?.locationNotes ?? null),
      categoryId,
      ...schedule,
      documentIds: [...new Set(documentIds)],
    };
  }
}
