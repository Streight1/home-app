import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { TASKS_QUERY_KEY } from '../../tasks/tasks-query.public.js';
import {
  completeMaintenanceOccurrence,
  archiveMaintenanceCategory,
  createMaintenanceCategory,
  createMaintenancePlan,
  createMaintenanceTask,
  createRecommendedMaintenanceCategories,
  getMaintenanceCategories,
  getMaintenanceDashboard,
  getMaintenanceOccurrences,
  getMaintenancePlan,
  getMaintenancePlans,
  getMaintenanceTaskContext,
  rescheduleMaintenanceOccurrence,
  skipMaintenanceOccurrence,
  transitionMaintenancePlan,
  updateMaintenanceCategory,
  updateMaintenancePlan,
} from '../api/maintenanceApi.js';
import type {
  MaintenancePlanFilters,
  MaintenancePlanInput,
} from '../types/maintenance.types.js';

export const MAINTENANCE_QUERY_KEY = ['maintenance'] as const;

export const useMaintenancePlans = (filters: MaintenancePlanFilters) =>
  useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, 'plans', filters],
    queryFn: () => getMaintenancePlans(filters),
    placeholderData: keepPreviousData,
  });

export const useMaintenancePlan = (planId: string | null) =>
  useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, 'plan', planId],
    queryFn: () => {
      if (!planId) throw new Error('Chybí plán údržby.');
      return getMaintenancePlan(planId);
    },
    enabled: Boolean(planId),
  });

export const useMaintenanceOccurrences = (
  input: Parameters<typeof getMaintenanceOccurrences>[0],
) =>
  useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, 'occurrences', input],
    queryFn: () => getMaintenanceOccurrences(input),
  });

export const useMaintenanceCategories = (includeArchived = false) =>
  useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, 'categories', includeArchived],
    queryFn: () => getMaintenanceCategories(includeArchived),
  });

export const useMaintenanceDashboard = () =>
  useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, 'dashboard'],
    queryFn: getMaintenanceDashboard,
  });

export const useMaintenanceTaskContext = (taskId: string) =>
  useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, 'task-context', taskId],
    queryFn: () => getMaintenanceTaskContext(taskId),
  });

export function useMaintenanceMutations() {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY });
  return {
    createPlan: useMutation({
      mutationFn: createMaintenancePlan,
      onSuccess: refresh,
    }),
    updatePlan: useMutation({
      mutationFn: ({
        planId,
        input,
      }: {
        planId: string;
        input: Partial<MaintenancePlanInput>;
      }) => updateMaintenancePlan(planId, input),
      onSuccess: refresh,
    }),
    transitionPlan: useMutation({
      mutationFn: ({
        planId,
        action,
      }: {
        planId: string;
        action: 'pause' | 'resume' | 'archive' | 'restore';
      }) => transitionMaintenancePlan(planId, action),
      onSuccess: refresh,
    }),
    complete: useMutation({
      mutationFn: ({
        occurrenceId,
        input,
      }: {
        occurrenceId: string;
        input: Parameters<typeof completeMaintenanceOccurrence>[1];
      }) => completeMaintenanceOccurrence(occurrenceId, input),
      onSuccess: refresh,
    }),
    skip: useMutation({
      mutationFn: ({
        occurrenceId,
        reason,
      }: {
        occurrenceId: string;
        reason: string | null;
      }) => skipMaintenanceOccurrence(occurrenceId, reason),
      onSuccess: refresh,
    }),
    reschedule: useMutation({
      mutationFn: ({
        occurrenceId,
        scheduledFor,
      }: {
        occurrenceId: string;
        scheduledFor: string;
      }) => rescheduleMaintenanceOccurrence(occurrenceId, scheduledFor),
      onSuccess: refresh,
    }),
    createTask: useMutation({
      mutationFn: createMaintenanceTask,
      onSuccess: () =>
        Promise.all([
          refresh(),
          client.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
        ]),
    }),
    recommendedCategories: useMutation({
      mutationFn: createRecommendedMaintenanceCategories,
      onSuccess: refresh,
    }),
    createCategory: useMutation({
      mutationFn: createMaintenanceCategory,
      onSuccess: refresh,
    }),
    updateCategory: useMutation({
      mutationFn: ({
        categoryId,
        input,
      }: {
        categoryId: string;
        input: Parameters<typeof updateMaintenanceCategory>[1];
      }) => updateMaintenanceCategory(categoryId, input),
      onSuccess: refresh,
    }),
    archiveCategory: useMutation({
      mutationFn: archiveMaintenanceCategory,
      onSuccess: refresh,
    }),
  };
}
