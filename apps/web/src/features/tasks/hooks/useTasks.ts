import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getTasks } from '../api/tasksApi.js';
import { TASKS_QUERY_KEY } from '../tasks-query.public.js';
import type { TaskListQuery } from '../types/task.types.js';

export function useTasks(query: TaskListQuery) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, 'tasks', query],
    queryFn: () => getTasks(query),
    placeholderData: keepPreviousData,
  });
}
