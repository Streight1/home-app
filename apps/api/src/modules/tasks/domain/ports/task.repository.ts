import type { HouseholdRole } from '../../../households/household.types.js';
import type { TaskCategoryColorToken } from './task-category.repository.js';
import type {
  TaskSortField,
  TaskPriority,
  TaskStatus,
  TaskView,
  RecurrenceFrequency,
  SortDirection,
} from '../task-status.js';

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');

export interface TaskPersonSummary {
  id: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface TaskCategorySummary {
  id: string;
  name: string;
  colorToken: TaskCategoryColorToken;
}

export interface TaskDocumentSummary {
  id: string;
  type: string;
  primaryLabel: string;
  canPreview: boolean;
}

export interface TaskCompletionRecord {
  id: string;
  occurrenceDueDate: string | null;
  occurrenceDueTimeMinutes: number | null;
  occurrenceDueAt: Date | null;
  completedAt: Date;
  note: string | null;
  completedBy: TaskPersonSummary;
}

export interface TaskCalendarScheduleSummary {
  eventId: string;
  startsAt: Date;
  endsAt: Date;
}

export interface TaskRecord {
  id: string;
  householdId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToUserId: string | null;
  participantUserIds: string[];
  participants: (TaskPersonSummary & { calendarColorToken: string })[];
  estimatedDurationMinutes: number | null;
  locationPlaceId: string | null;
  locationLabel: string | null;
  locationNotes: string | null;
  dueDate: string | null;
  dueTimeMinutes: number | null;
  dueAt: Date | null;
  isAllDay: boolean;
  timezone: string;
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceInterval: number;
  recurrenceDaysOfWeek: number[];
  recurrenceDayOfMonth: number | null;
  recurrenceMonthOfYear: number | null;
  recurrenceEndsAt: Date | null;
  nextOccurrenceAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: TaskPersonSummary | null;
  createdBy: TaskPersonSummary;
  category: TaskCategorySummary | null;
  completions: TaskCompletionRecord[];
  documentIds: string[];
  calendarSchedule: TaskCalendarScheduleSummary | null;
}

export interface TaskMemberOption extends TaskPersonSummary {
  role: HouseholdRole;
  calendarColorToken: string;
}

export interface TaskWriteInput {
  title: string;
  description: string | null;
  priority: TaskPriority;
  assignedToUserId: string | null;
  participantUserIds: string[];
  estimatedDurationMinutes: number | null;
  locationPlaceId: string | null;
  locationLabel: string | null;
  locationNotes: string | null;
  dueDate: string | null;
  dueTimeMinutes: number | null;
  categoryId: string | null;
  dueAt: Date | null;
  isAllDay: boolean;
  timezone: string;
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceInterval: number;
  recurrenceDaysOfWeek: number[];
  recurrenceDayOfMonth: number | null;
  recurrenceMonthOfYear: number | null;
  recurrenceEndsAt: Date | null;
  nextOccurrenceAt: Date | null;
  documentIds: string[];
}

export interface ListTasksInput {
  householdId: string;
  view: TaskView;
  page: number;
  pageSize: 10 | 20 | 50 | 100;
  now: Date;
  timezone: string;
  query?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToUserId?: string;
  categoryId?: string;
  dueFrom?: Date;
  dueTo?: Date;
  sortBy: TaskSortField;
  sortDirection: SortDirection;
  useDefaultAllOrder: boolean;
}

export interface TaskRepository {
  findById(householdId: string, taskId: string): Promise<TaskRecord | null>;
  list(
    input: ListTasksInput,
  ): Promise<{ items: TaskRecord[]; totalItems: number }>;
  listMembers(householdId: string): Promise<TaskMemberOption[]>;
  isActiveMember(householdId: string, userId: string): Promise<boolean>;
  create(input: {
    householdId: string;
    userId: string;
    task: TaskWriteInput;
  }): Promise<TaskRecord>;
  update(input: {
    householdId: string;
    userId: string;
    taskId: string;
    task: Partial<TaskWriteInput>;
    changedFields: readonly string[];
  }): Promise<TaskRecord | null>;
  complete(input: {
    householdId: string;
    userId: string;
    taskId: string;
    completedAt: Date;
    note: string | null;
    nextDueDate: string | null;
    nextDueTimeMinutes: number | null;
    nextDueAt: Date | null;
    remainsOpen: boolean;
  }): Promise<TaskRecord | null>;
  transition(input: {
    householdId: string;
    userId: string;
    taskId: string;
    fromStatuses: readonly TaskStatus[];
    status: TaskStatus;
    completedAt?: Date | null;
    cancelledAt?: Date | null;
    archivedAt?: Date | null;
    action: 'TASK_REOPENED' | 'TASK_CANCELLED' | 'TASK_ARCHIVED';
  }): Promise<TaskRecord | null>;
  attention(input: {
    householdId: string;
    now: Date;
    timezone: string;
    limit: number;
  }): Promise<{
    items: TaskRecord[];
    todayCount: number;
    overdueCount: number;
  }>;
  dashboard(input: {
    householdId: string;
    now: Date;
    timezone: string;
    limit: number;
  }): Promise<{
    items: TaskRecord[];
    openTotal: number;
    overdueTotal: number;
    dueTodayTotal: number;
    upcomingTotal: number;
  }>;
  calendarFeed(input: {
    householdId: string;
    from: Date;
    to: Date;
  }): Promise<TaskRecord[]>;
}
