import { useQuery } from '@tanstack/react-query';
import { getTaskDashboard } from '../api/tasksApi.js';
import type { TaskDashboard } from '../types/task.types.js';
import { TASKS_QUERY_KEY } from '../tasks-query.public.js';

export function useTasksDashboard(initialData?: TaskDashboard) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, 'dashboard'],
    queryFn: getTaskDashboard,
    initialData,
    staleTime: initialData ? Number.POSITIVE_INFINITY : 30_000,
  });
}
