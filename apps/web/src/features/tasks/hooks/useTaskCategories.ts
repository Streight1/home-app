import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTaskCategory,
  deleteTaskCategory,
  getTaskCategories,
  updateTaskCategory,
} from '../api/taskCategoriesApi.js';
import type { TaskCategory } from '../types/task.types.js';
import { TASKS_QUERY_KEY } from '../tasks-query.public.js';

const key = [...TASKS_QUERY_KEY, 'categories'] as const;

export function useTaskCategories() {
  return useQuery({ queryKey: key, queryFn: getTaskCategories });
}

export function useCreateTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaskCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { name?: string; colorToken?: TaskCategory['colorToken'] };
    }) => updateTaskCategory(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaskCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}
