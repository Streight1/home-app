export const taskStatuses = [
  'OPEN',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED',
] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export const taskPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;

export type TaskPriority = (typeof taskPriorities)[number];

export const recurrenceFrequencies = [
  'NONE',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
] as const;

export type RecurrenceFrequency = (typeof recurrenceFrequencies)[number];

export const taskViews = [
  'today',
  'upcoming',
  'overdue',
  'all',
  'completed',
  'cancelled',
  'archived',
] as const;

export type TaskView = (typeof taskViews)[number];

export const taskSortFields = [
  'dueAt',
  'completedAt',
  'createdAt',
  'updatedAt',
  'title',
  'priority',
] as const;

export type TaskSortField = (typeof taskSortFields)[number];
export type SortDirection = 'asc' | 'desc';
