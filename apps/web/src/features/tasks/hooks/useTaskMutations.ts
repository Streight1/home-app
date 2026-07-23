import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  archiveTask,
  cancelTask,
  completeTask,
  createTask,
  reopenTask,
  updateTask,
} from '../api/tasksApi.js';
import type { TaskInput } from '../types/task.types.js';
import { TASKS_QUERY_KEY } from './useTasks.js';

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}

export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<TaskInput>) => updateTask(taskId, input),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, note }: { taskId: string; note?: string }) =>
      completeTask(taskId, note),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}

function useTaskTransition(
  action: (taskId: string) => ReturnType<typeof reopenTask>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}

export function useReopenTask() {
  return useTaskTransition(reopenTask);
}
export function useCancelTask() {
  return useTaskTransition(cancelTask);
}
export function useArchiveTask() {
  return useTaskTransition(archiveTask);
}
