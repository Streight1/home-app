import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { invalidTaskInput } from '../../domain/task.errors.js';
import {
  TASK_REPOSITORY,
  type TaskRepository,
} from '../../domain/ports/task.repository.js';
import type { TaskSortField } from '../../domain/task-status.js';
import { CLOCK_PORT, type ClockPort } from '../../domain/ports/clock.port.js';
import { TASK_READ_MINIMUM_ROLE } from '../../domain/task-access.policy.js';
import { isValidTimezone } from '../../domain/zoned-date.js';
import type { ListTasksQueryDto } from '../../presentation/dto/list-tasks-query.dto.js';
import { MapTasksService } from '../mappers/map-tasks.service.js';

function defaultSort(view: ListTasksQueryDto['view']): TaskSortField {
  if (view === 'today' || view === 'upcoming' || view === 'overdue')
    return 'dueAt';
  if (view === 'completed') return 'completedAt';
  return view === 'all' ? 'dueAt' : 'createdAt';
}

@Injectable()
export class ListTasksService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(TASK_REPOSITORY)
    private readonly tasks: TaskRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly responses: MapTasksService,
  ) {}

  public async execute(userId: string, query: ListTasksQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      TASK_READ_MINIMUM_ROLE,
    );
    if (!isValidTimezone(query.timezone))
      throw invalidTaskInput('Časové pásmo není platné.');
    const now = this.clock.now();
    const result = await this.tasks.list({
      householdId: membership.householdId,
      view: query.view,
      page: query.page,
      pageSize: query.pageSize,
      now,
      timezone: query.timezone,
      sortBy: query.sortBy ?? defaultSort(query.view),
      sortDirection:
        query.sortDirection ?? (query.view === 'completed' ? 'desc' : 'asc'),
      useDefaultAllOrder: query.view === 'all' && query.sortBy === undefined,
      ...(query.query?.trim() ? { query: query.query.trim() } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assignedToUserId
        ? { assignedToUserId: query.assignedToUserId }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.dueFrom ? { dueFrom: new Date(query.dueFrom) } : {}),
      ...(query.dueTo ? { dueTo: new Date(query.dueTo) } : {}),
    });
    return {
      items: await this.responses.many(
        userId,
        membership.role,
        now,
        result.items,
      ),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / query.pageSize),
      },
      members: await this.tasks.listMembers(membership.householdId),
    };
  }
}
