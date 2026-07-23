import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ApiException } from '../src/common/errors/api-exception.js';
import { CompleteTaskService } from '../src/modules/tasks/application/tasks/complete-task.service.js';
import { TaskWriteValidationService } from '../src/modules/tasks/application/tasks/task-write-validation.service.js';
import { ResolveTaskScheduleService } from '../src/modules/tasks/application/tasks/resolve-task-schedule.service.js';
import { CalculateNextOccurrenceService } from '../src/modules/tasks/application/recurrence/calculate-next-occurrence.service.js';
import { ValidateRecurrenceService } from '../src/modules/tasks/application/recurrence/validate-recurrence.service.js';
import { TaskResponseMapper } from '../src/modules/tasks/application/mappers/task-response.mapper.js';
import type { MapTasksService } from '../src/modules/tasks/application/mappers/map-tasks.service.js';
import type {
  TaskRecord,
  TaskRepository,
} from '../src/modules/tasks/domain/ports/task.repository.js';
import type { ClockPort } from '../src/modules/tasks/domain/ports/clock.port.js';
import type { TaskCategoryRepository } from '../src/modules/tasks/domain/ports/task-category.repository.js';
import { CreateTaskDto } from '../src/modules/tasks/presentation/dto/create-task.dto.js';
import type { DocumentsFacade } from '../src/modules/documents/documents.facade.js';
import type { LocationFacade } from '../src/modules/location/location.facade.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import type { HouseholdRole } from '../src/modules/households/household.types.js';

const householdId = '10000000-0000-4000-8000-000000000001';
const userId = '20000000-0000-4000-8000-000000000002';
const taskId = '30000000-0000-4000-8000-000000000003';
const now = new Date('2026-07-15T10:00:00.000Z');

function task(patch: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: taskId,
    householdId,
    categoryId: null,
    title: 'Revize kotle',
    description: null,
    status: 'OPEN',
    priority: 'HIGH',
    assignedToUserId: userId,
    participantUserIds: [userId],
    participants: [
      {
        id: userId,
        displayName: 'Jana',
        email: 'jana@example.test',
        avatarUrl: null,
        calendarColorToken: 'violet',
      },
    ],
    estimatedDurationMinutes: 60,
    locationPlaceId: null,
    locationLabel: null,
    locationNotes: null,
    dueDate: '2026-07-16',
    dueTimeMinutes: 600,
    dueAt: new Date('2026-07-16T08:00:00.000Z'),
    isAllDay: false,
    timezone: 'Europe/Prague',
    recurrenceFrequency: 'NONE',
    recurrenceInterval: 1,
    recurrenceDaysOfWeek: [],
    recurrenceDayOfMonth: null,
    recurrenceMonthOfYear: null,
    recurrenceEndsAt: null,
    nextOccurrenceAt: null,
    completedAt: null,
    cancelledAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    assignedTo: {
      id: userId,
      displayName: 'Jana',
      email: 'jana@example.test',
      avatarUrl: null,
    },
    createdBy: {
      id: userId,
      displayName: 'Jana',
      email: 'jana@example.test',
      avatarUrl: null,
    },
    category: null,
    completions: [],
    documentIds: [],
    calendarSchedule: null,
    ...patch,
  };
}

function access(role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER') {
  return {
    getActiveMembership: vi.fn().mockImplementation((_userId, minimum) => {
      const rank = { VIEWER: 1, MEMBER: 2, ADMIN: 3, OWNER: 4 };
      if (rank[role] < rank[minimum as keyof typeof rank])
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'HOUSEHOLD_ACCESS_DENIED',
          'Zakázáno.',
        );
      return Promise.resolve({ householdId, role });
    }),
  } as unknown as HouseholdAccessService;
}

function completionService(
  repository: TaskRepository,
  role: 'MEMBER' | 'VIEWER' = 'MEMBER',
) {
  const clock = { now: () => now } as ClockPort;
  const responses = {
    one: vi.fn(
      async (
        _user: string,
        _role: HouseholdRole,
        _now: Date,
        result: TaskRecord,
      ) => Promise.resolve(result),
    ),
  } as unknown as MapTasksService;
  return new CompleteTaskService(
    access(role),
    repository,
    clock,
    new CalculateNextOccurrenceService(),
    responses,
  );
}

describe('agenda task services and access policy', () => {
  it('completes a one-time task and records a completion transition', async () => {
    const complete = vi
      .fn()
      .mockResolvedValue(task({ status: 'COMPLETED', completedAt: now }));
    const repository = {
      findById: vi.fn().mockResolvedValue(task()),
      complete,
    } as unknown as TaskRepository;
    await completionService(repository).execute(userId, taskId, {
      note: 'Hotovo',
    });
    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({
        remainsOpen: false,
        nextDueAt: null,
        note: 'Hotovo',
      }),
    );
  });

  it('keeps a recurring task open and advances its due date', async () => {
    const recurring = task({
      recurrenceFrequency: 'DAILY',
      recurrenceInterval: 2,
    });
    const complete = vi.fn().mockResolvedValue(recurring);
    const repository = {
      findById: vi.fn().mockResolvedValue(recurring),
      complete,
    } as unknown as TaskRepository;
    await completionService(repository).execute(userId, taskId, {});
    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({
        remainsOpen: true,
        nextDueAt: new Date('2026-07-18T08:00:00.000Z'),
      }),
    );
  });

  it('keeps a recurring date-only task free of a hidden midnight instant', async () => {
    const recurring = task({
      dueDate: '2026-07-16',
      dueTimeMinutes: null,
      dueAt: null,
      isAllDay: true,
      recurrenceFrequency: 'DAILY',
    });
    const complete = vi.fn().mockResolvedValue(recurring);
    const repository = {
      findById: vi.fn().mockResolvedValue(recurring),
      complete,
    } as unknown as TaskRepository;
    await completionService(repository).execute(userId, taskId, {});
    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({
        remainsOpen: true,
        nextDueDate: '2026-07-17',
        nextDueTimeMinutes: null,
        nextDueAt: null,
      }),
    );
  });

  it('finishes a recurring series when recurrenceEndsAt blocks the next date', async () => {
    const recurring = task({
      recurrenceFrequency: 'DAILY',
      recurrenceEndsAt: new Date('2026-07-16T20:00:00.000Z'),
    });
    const complete = vi.fn().mockResolvedValue(task({ status: 'COMPLETED' }));
    const repository = {
      findById: vi.fn().mockResolvedValue(recurring),
      complete,
    } as unknown as TaskRepository;
    await completionService(repository).execute(userId, taskId, {});
    expect(complete).toHaveBeenCalledWith(
      expect.objectContaining({ remainsOpen: false, nextDueAt: null }),
    );
  });

  it('does not allow a viewer to complete a task', async () => {
    const repository = { findById: vi.fn() } as unknown as TaskRepository;
    await expect(
      completionService(repository, 'VIEWER').execute(userId, taskId, {}),
    ).rejects.toMatchObject({ code: 'HOUSEHOLD_ACCESS_DENIED' });
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('rejects completion of a non-open task', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(task({ status: 'CANCELLED' })),
    } as unknown as TaskRepository;
    await expect(
      completionService(repository).execute(userId, taskId, {}),
    ).rejects.toMatchObject({ code: 'TASK_CONFLICT' });
  });

  it('maps viewer permissions as read-only', () => {
    const response = new TaskResponseMapper().map(task(), 'VIEWER', now);
    expect(response.permissions).toEqual({
      canEdit: false,
      canComplete: false,
      canReopen: false,
      canCancel: false,
      canArchive: false,
      canSchedule: false,
      canUnschedule: false,
    });
  });

  it('marks an overdue open task without relying on a frontend label', () => {
    const response = new TaskResponseMapper().map(
      task({
        dueDate: '2026-07-14',
        dueAt: new Date('2026-07-14T08:00:00.000Z'),
      }),
      'MEMBER',
      now,
    );
    expect(response.timing).toBe('OVERDUE');
  });

  it('keeps a date-only task current for its whole local due date', () => {
    const mapper = new TaskResponseMapper();
    const dateOnly = task({
      dueDate: '2026-07-15',
      dueTimeMinutes: null,
      dueAt: null,
      isAllDay: true,
    });
    expect(mapper.map(dateOnly, 'MEMBER', now).timing).toBe('TODAY');
    expect(
      mapper.map(dateOnly, 'MEMBER', new Date('2026-07-16T00:00:00.000Z'))
        .timing,
    ).toBe('OVERDUE');
  });

  it('maps a task without a due date as unscheduled', () => {
    expect(
      new TaskResponseMapper().map(
        task({ dueDate: null, dueTimeMinutes: null, dueAt: null }),
        'MEMBER',
        now,
      ).timing,
    ).toBe('UNSCHEDULED');
  });

  it.each([30, 60, 90, 120, 75])(
    'accepts a %i minute duration',
    async (estimatedDurationMinutes) => {
      const input = validInput();
      input.estimatedDurationMinutes = estimatedDurationMinutes;
      await expect(
        writeValidation().create(userId, householdId, input),
      ).resolves.toMatchObject({ estimatedDurationMinutes });
    },
  );

  it.each([
    { dueDate: null, dueTimeMinutes: null, dueAt: null, isAllDay: false },
    {
      dueDate: '2026-07-17',
      dueTimeMinutes: null,
      dueAt: null,
      isAllDay: true,
    },
    {
      dueDate: '2026-07-17',
      dueTimeMinutes: 600,
      dueAt: new Date('2026-07-17T08:00:00.000Z'),
      isAllDay: false,
    },
  ])('builds the supported due-date state %#', async (expected) => {
    const input = validInput();
    input.dueDate = expected.dueDate;
    input.dueTimeMinutes = expected.dueTimeMinutes;
    await expect(
      writeValidation().create(userId, householdId, input),
    ).resolves.toMatchObject(expected);
  });

  it('validates an assignee as an active household member', async () => {
    const repository = {
      isActiveMember: vi.fn().mockResolvedValue(false),
    } as unknown as TaskRepository;
    const service = writeValidation(repository);
    const input = validInput();
    await expect(
      service.create(userId, householdId, input),
    ).rejects.toMatchObject({ code: 'TASK_INVALID_INPUT' });
  });

  it('rejects a category from another household', async () => {
    const repository = {
      isActiveMember: vi.fn().mockResolvedValue(true),
    } as unknown as TaskRepository;
    const service = writeValidation(repository, {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as TaskCategoryRepository);
    const input = validInput();
    input.categoryId = '40000000-0000-4000-8000-000000000004';
    await expect(
      service.create(userId, householdId, input),
    ).rejects.toMatchObject({ code: 'TASK_CATEGORY_NOT_FOUND' });
  });

  it('uses DocumentsFacade and rejects inaccessible document links', async () => {
    const documents = {
      verifyAccessibleSummaries: vi
        .fn()
        .mockRejectedValue(
          new ApiException(
            HttpStatus.NOT_FOUND,
            'DOCUMENT_NOT_FOUND',
            'Nenalezeno.',
          ),
        ),
    } as unknown as DocumentsFacade;
    const input = validInput();
    input.documentIds = ['50000000-0000-4000-8000-000000000005'];
    await expect(
      writeValidation(undefined, undefined, documents).create(
        userId,
        householdId,
        input,
      ),
    ).rejects.toMatchObject({ code: 'DOCUMENT_NOT_FOUND' });
  });

  it('builds a valid household-scoped task input without exposing documents internals', async () => {
    const documents = {
      verifyAccessibleSummaries: vi.fn().mockResolvedValue([
        {
          id: '50000000-0000-4000-8000-000000000005',
          type: 'GENERAL',
          primaryLabel: 'Revize',
          canPreview: true,
        },
      ]),
    } as unknown as DocumentsFacade;
    const input = validInput();
    input.documentIds = ['50000000-0000-4000-8000-000000000005'];
    const result = await writeValidation(
      undefined,
      undefined,
      documents,
    ).create(userId, householdId, input);
    expect(result).toMatchObject({
      title: 'Revize kotle',
      timezone: 'Europe/Prague',
      documentIds: input.documentIds,
    });
    expect(JSON.stringify(result)).not.toContain('storageKey');
  });
});

function validInput(): CreateTaskDto {
  const input = new CreateTaskDto();
  input.title = 'Revize kotle';
  input.assignedToUserId = userId;
  return input;
}

function writeValidation(
  tasks: TaskRepository = {
    isActiveMember: vi.fn().mockResolvedValue(true),
  } as unknown as TaskRepository,
  categories: TaskCategoryRepository = {
    findById: vi.fn().mockResolvedValue({ id: 'category' }),
  } as unknown as TaskCategoryRepository,
  documents: DocumentsFacade = {
    verifyAccessibleSummaries: vi.fn().mockResolvedValue([]),
  } as unknown as DocumentsFacade,
  locations: LocationFacade = {
    findAccessiblePlace: vi.fn().mockResolvedValue(null),
  } as unknown as LocationFacade,
) {
  return new TaskWriteValidationService(
    tasks,
    categories,
    documents,
    locations,
    new ResolveTaskScheduleService(new ValidateRecurrenceService()),
  );
}
