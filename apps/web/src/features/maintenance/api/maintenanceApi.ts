import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  MaintenanceCategory,
  MaintenanceDashboard,
  MaintenanceOccurrence,
  MaintenancePlan,
  MaintenancePlanFilters,
  MaintenancePlanInput,
  MaintenanceTaskContext,
} from '../types/maintenance.types.js';

function queryString(
  input: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value !== undefined && value !== '') query.set(key, String(value));
  return query.toString();
}

export const getMaintenancePlans = (filters: MaintenancePlanFilters) =>
  apiRequest<{
    items: MaintenancePlan[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }>(
    `/maintenance/plans?${queryString({
      query: filters.query,
      status: filters.status,
      priority: filters.priority,
      categoryId: filters.categoryId,
      responsibleUserId: filters.responsibleUserId,
      overdueOnly: filters.overdueOnly,
      pausedOnly: filters.pausedOnly,
      page: filters.page,
      pageSize: filters.pageSize,
      sortBy: filters.sortBy,
      sortDirection: filters.sortDirection,
    })}`,
  );

export const getMaintenancePlan = (planId: string) =>
  apiRequest<MaintenancePlan>(`/maintenance/plans/${planId}`);

export const getMaintenanceTaskContext = (taskId: string) =>
  apiRequest<MaintenanceTaskContext>(`/maintenance/tasks/${taskId}`);

export const createMaintenancePlan = (input: MaintenancePlanInput) =>
  apiRequest<MaintenancePlan>('/maintenance/plans', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateMaintenancePlan = (
  planId: string,
  input: Partial<MaintenancePlanInput>,
) =>
  apiRequest<MaintenancePlan>(`/maintenance/plans/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const transitionMaintenancePlan = (
  planId: string,
  action: 'pause' | 'resume' | 'archive' | 'restore',
) =>
  apiRequest<MaintenancePlan>(`/maintenance/plans/${planId}/${action}`, {
    method: 'POST',
  });

export const getMaintenanceOccurrences = (input: {
  planId?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  history?: boolean;
}) => {
  const { history, ...query } = input;
  return apiRequest<{
    items: MaintenanceOccurrence[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }>(
    `/maintenance/${history ? 'history' : 'occurrences'}?${queryString(query)}`,
  );
};

export const completeMaintenanceOccurrence = (
  occurrenceId: string,
  input: {
    completedOn: string;
    completedByUserId?: string;
    notes?: string | null;
    providerName?: string | null;
    actualCostMinor?: string | null;
    currencyCode?: string | null;
    nextDueOn?: string;
    documentIds: string[];
    transactionIds: string[];
  },
) =>
  apiRequest<MaintenanceOccurrence>(
    `/maintenance/occurrences/${occurrenceId}/complete`,
    { method: 'POST', body: JSON.stringify(input) },
  );

export const skipMaintenanceOccurrence = (
  occurrenceId: string,
  reason: string | null,
) =>
  apiRequest<MaintenanceOccurrence>(
    `/maintenance/occurrences/${occurrenceId}/skip`,
    { method: 'POST', body: JSON.stringify({ reason }) },
  );

export const rescheduleMaintenanceOccurrence = (
  occurrenceId: string,
  scheduledFor: string,
) =>
  apiRequest<MaintenanceOccurrence>(
    `/maintenance/occurrences/${occurrenceId}/reschedule`,
    { method: 'POST', body: JSON.stringify({ scheduledFor }) },
  );

export const createMaintenanceTask = (occurrenceId: string) =>
  apiRequest<MaintenanceOccurrence>(
    `/maintenance/occurrences/${occurrenceId}/task`,
    { method: 'POST' },
  );

export const getMaintenanceCategories = (includeArchived = false) =>
  apiRequest<{ items: MaintenanceCategory[] }>(
    `/maintenance/categories?${queryString({ includeArchived })}`,
  );

export const createRecommendedMaintenanceCategories = () =>
  apiRequest<{ createdCount: number }>('/maintenance/categories/recommended', {
    method: 'POST',
  });

export const createMaintenanceCategory = (input: {
  name: string;
  iconKey: string;
  colorToken: string;
}) =>
  apiRequest<MaintenanceCategory>('/maintenance/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateMaintenanceCategory = (
  categoryId: string,
  input: { name: string; iconKey: string; colorToken: string },
) =>
  apiRequest<MaintenanceCategory>(`/maintenance/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const archiveMaintenanceCategory = (categoryId: string) =>
  apiRequest<{ id: string }>(`/maintenance/categories/${categoryId}/archive`, {
    method: 'POST',
  });

export const getMaintenanceDashboard = () =>
  apiRequest<MaintenanceDashboard>('/maintenance/dashboard');
