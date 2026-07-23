import { apiRequest } from '../../../lib/api/apiClient.js';
import type { TaskCategory } from '../types/task.types.js';

export function getTaskCategories() {
  return apiRequest<TaskCategory[]>('/tasks/categories');
}

export function createTaskCategory(input: {
  name: string;
  colorToken: TaskCategory['colorToken'];
}) {
  return apiRequest<TaskCategory>('/tasks/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTaskCategory(
  categoryId: string,
  input: { name?: string; colorToken?: TaskCategory['colorToken'] },
) {
  return apiRequest<TaskCategory>(`/tasks/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteTaskCategory(categoryId: string) {
  return apiRequest<undefined>(`/tasks/categories/${categoryId}`, {
    method: 'DELETE',
  });
}
