export type HouseholdRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type RecurrenceFrequency =
  | 'NONE'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'YEARLY';
export type TaskView = 'today' | 'upcoming' | 'overdue' | 'all' | 'completed';

export interface TaskPerson {
  id: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface TaskParticipant extends TaskPerson {
  calendarColorToken: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  normalizedName?: string;
  colorToken: 'primary' | 'blue' | 'cyan' | 'success' | 'warning' | 'danger';
  createdAt?: string;
  updatedAt?: string;
}

export interface LinkedTaskDocument {
  id: string;
  type: string;
  primaryLabel: string;
  canPreview: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  timing: 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'UNSCHEDULED' | TaskStatus;
  assignedTo: TaskPerson | null;
  participants: TaskParticipant[];
  estimatedDurationMinutes: number | null;
  location: {
    placeId: string | null;
    label: string | null;
    notes: string | null;
    routable: boolean;
  } | null;
  category: TaskCategory | null;
  dueDate: string | null;
  dueTimeMinutes: number | null;
  dueAt: string | null;
  isAllDay: boolean;
  timezone: string;
  recurrence: {
    frequency: RecurrenceFrequency;
    interval: number;
    daysOfWeek: number[];
    dayOfMonth: number | null;
    monthOfYear: number | null;
    endsAt: string | null;
    nextOccurrenceAt: string | null;
    nextOccurrenceDate: string | null;
  };
  completedAt: string | null;
  cancelledAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: TaskPerson;
  documents: LinkedTaskDocument[];
  documentCount: number;
  calendarSchedule: {
    eventId: string;
    startsAt: string;
    endsAt: string;
  } | null;
  completions: {
    id: string;
    occurrenceDueDate: string | null;
    occurrenceDueTimeMinutes: number | null;
    occurrenceDueAt: string | null;
    completedAt: string;
    note: string | null;
    completedBy: TaskPerson;
  }[];
  permissions: {
    canEdit: boolean;
    canComplete: boolean;
    canReopen: boolean;
    canCancel: boolean;
    canArchive: boolean;
    canSchedule: boolean;
    canUnschedule: boolean;
  };
}

export interface TaskMember extends TaskPerson {
  role: HouseholdRole;
  calendarColorToken: string;
}

export interface TaskListQuery {
  view: TaskView;
  page: number;
  pageSize: 10 | 20 | 50 | 100;
  query?: string;
  priority?: TaskPriority;
  assignedToUserId?: string;
  categoryId?: string;
  sortBy?:
    | 'dueAt'
    | 'completedAt'
    | 'createdAt'
    | 'updatedAt'
    | 'title'
    | 'priority';
  sortDirection?: 'asc' | 'desc';
}

export interface TaskListResponse {
  items: Task[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  members: TaskMember[];
}

export interface TaskInput {
  title: string;
  description?: string | null;
  priority: TaskPriority;
  assignedToUserId?: string | null;
  participantUserIds: string[];
  estimatedDurationMinutes?: number | null;
  locationPlaceId?: string | null;
  locationLabel?: string | null;
  locationNotes?: string | null;
  categoryId?: string | null;
  dueDate?: string | null;
  dueTimeMinutes?: number | null;
  timezone: string;
  recurrenceFrequency: RecurrenceFrequency;
  recurrenceInterval: number;
  recurrenceDaysOfWeek: number[];
  recurrenceDayOfMonth?: number | null;
  recurrenceMonthOfYear?: number | null;
  recurrenceEndsAt?: string | null;
  documentIds: string[];
}

export interface TaskDashboard {
  summary: {
    openTotal: number;
    overdueTotal: number;
    dueTodayTotal: number;
    upcomingTotal: number;
  };
  items: {
    id: string;
    title: string;
    dueDate: string | null;
    dueTimeMinutes: number | null;
    dueAt: string | null;
    isAllDay: boolean;
    priority: TaskPriority;
    assignedTo: TaskPerson | null;
    participants: TaskParticipant[];
    isRecurring: boolean;
    isOverdue: boolean;
    permissions: { canComplete: boolean };
    navigationTarget: { area: 'tasks'; screen: 'detail'; taskId: string };
  }[];
}
