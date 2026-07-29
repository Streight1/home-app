import type { WorkspaceView } from '../../../app/workspace-navigation/workspace-navigation.types.js';

export type MaintenancePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type MaintenancePlanStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED';
export type MaintenanceOccurrenceStatus =
  | 'SCHEDULED'
  | 'TASK_CREATED'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED';

export interface MaintenanceRecurrence {
  frequency:
    | 'ONCE'
    | 'DAILY'
    | 'WEEKLY'
    | 'MONTHLY'
    | 'YEARLY'
    | 'CUSTOM_MONTHS';
  interval: number;
  weekdays?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  months?: number[];
  ordinal?: 1 | 2 | 3 | 4 | 5 | -1;
  weekday?: number;
}

export interface MaintenanceCategory {
  id: string;
  name: string;
  normalizedName?: string;
  iconKey: string;
  colorToken: string;
  sortOrder: number;
  archivedAt: string | null;
}

export interface MaintenancePlan {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  priority: MaintenancePriority;
  status: MaintenancePlanStatus;
  recurrence: MaintenanceRecurrence;
  recurrenceBasis: 'FROM_SCHEDULED_DATE' | 'FROM_COMPLETION_DATE';
  startsOn: string;
  endsOn: string | null;
  nextDueOn: string | null;
  overdue: boolean;
  leadDays: number;
  estimatedDurationMinutes: number | null;
  preferredStartTime: number | null;
  locationLabel: string | null;
  providerName: string | null;
  defaultCost: MoneyValue | null;
  autoCreateTask: boolean;
  taskCreateDaysBefore: number;
  category: Pick<
    MaintenanceCategory,
    'id' | 'name' | 'iconKey' | 'colorToken'
  > | null;
  responsible: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  occurrenceCount: number;
  createdAt: string;
  updatedAt: string;
  permissions: {
    canEdit: boolean;
    canComplete: boolean;
    canArchive: boolean;
  };
  occurrences?: MaintenancePlanOccurrence[];
}

export interface MoneyValue {
  amountMinor: string;
  currencyCode: string;
}

export interface MaintenancePlanOccurrence {
  id: string;
  scheduledFor: string;
  originalScheduledFor: string;
  status: MaintenanceOccurrenceStatus;
  taskId: string | null;
  completedOn: string | null;
  completedAt: string | null;
  completionNotes: string | null;
  skipReason: string | null;
  documentIds: string[];
  transactionIds: string[];
}

export interface MaintenanceOccurrence {
  id: string;
  plan: {
    id: string;
    title: string;
    priority: MaintenancePriority;
    status: MaintenancePlanStatus;
    category: MaintenancePlan['category'];
    responsible: MaintenancePlan['responsible'];
  };
  scheduledFor: string;
  originalScheduledFor: string;
  status: MaintenanceOccurrenceStatus;
  taskId: string | null;
  completedOn: string | null;
  completedAt: string | null;
  completionNotes: string | null;
  skipReason: string | null;
  providerName: string | null;
  actualCost: MoneyValue | null;
  documents: {
    id: string;
    type: string;
    primaryLabel: string;
    canPreview: boolean;
  }[];
  transactions: {
    id: string;
    type: string;
    amountMinor: string;
    currencyCode: string;
    bookedDate: string;
    description: string | null;
    counterpartyName: string | null;
  }[];
  permissions: { canMutate: boolean };
}

export interface MaintenancePlanInput {
  title: string;
  description: string | null;
  instructions: string | null;
  priority: MaintenancePriority;
  categoryId: string | null;
  recurrence: MaintenanceRecurrence;
  recurrenceBasis: 'FROM_SCHEDULED_DATE' | 'FROM_COMPLETION_DATE';
  startsOn: string;
  endsOn: string | null;
  leadDays: number;
  estimatedDurationMinutes: number | null;
  preferredStartTime: number | null;
  responsibleUserId: string | null;
  locationLabel: string | null;
  providerName: string | null;
  defaultCostMinor: string | null;
  defaultCurrencyCode: string | null;
  autoCreateTask: boolean;
  taskCreateDaysBefore: number;
}

export interface MaintenanceDashboard {
  summary: {
    overdueTotal: number;
    dueTodayTotal: number;
    dueWithinSevenDaysTotal: number;
    dueWithinThirtyDaysTotal: number;
    pausedTotal: number;
  };
  items: {
    id: string;
    title: string;
    nextDueOn: string;
    priority: MaintenancePriority;
    overdue: boolean;
    category: MaintenancePlan['category'];
    responsible: MaintenancePlan['responsible'];
    permissions: { canComplete: boolean };
    navigationTarget: Extract<WorkspaceView, { area: 'maintenance' }>;
  }[];
  recentlyCompleted: {
    occurrenceId: string;
    planId: string;
    title: string;
    completedOn: string | null;
    completedAt: string | null;
    completedBy: MaintenancePlan['responsible'];
  } | null;
}

export interface MaintenanceTaskContext {
  occurrenceId: string;
  planId: string;
  planTitle: string;
  planStatus: MaintenancePlanStatus;
  occurrenceStatus: MaintenanceOccurrenceStatus;
  scheduledFor: string;
  permissions: { canComplete: boolean };
  navigationTarget: Extract<WorkspaceView, { area: 'maintenance' }>;
}

export interface MaintenancePlanFilters {
  query?: string | undefined;
  status?: MaintenancePlanStatus | undefined;
  priority?: MaintenancePriority | undefined;
  categoryId?: string | undefined;
  responsibleUserId?: string | undefined;
  overdueOnly?: boolean | undefined;
  pausedOnly?: boolean | undefined;
  page: number;
  pageSize: 10 | 20 | 50 | 100;
  sortBy: 'nextDueOn' | 'title' | 'priority' | 'updatedAt' | 'createdAt';
  sortDirection: 'asc' | 'desc';
}
