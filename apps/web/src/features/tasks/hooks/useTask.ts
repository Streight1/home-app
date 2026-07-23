import { useQuery } from '@tanstack/react-query';
import { getTask } from '../api/tasksApi.js';
import { TASKS_QUERY_KEY } from './useTasks.js';

export function useTask(taskId: string) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, 'task', taskId],
    queryFn: () => getTask(taskId),
    enabled: Boolean(taskId),
  });
}
