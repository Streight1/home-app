import { apiRequest } from '../../../lib/api/apiClient.js';
import { browserTimezone } from '../lib/browserTimezone.js';
import type {
  TaskDashboard,
  TaskListQuery,
  TaskListResponse,
  Task,
  TaskInput,
} from '../types/task.types.js';

function parameters(
  input: Record<string, string | number | boolean | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value !== undefined && value !== '') query.set(key, String(value));
  return query.toString();
}

export function getTasks(query: TaskListQuery) {
  const suffix = parameters({ ...query, timezone: browserTimezone() });
  return apiRequest<TaskListResponse>(`/tasks?${suffix}`);
}

export function getTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}`);
}

export function createTask(input: TaskInput) {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTask(taskId: string, input: Partial<TaskInput>) {
  return apiRequest<Task>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function completeTask(taskId: string, note?: string) {
  const normalizedNote = note?.trim();
  return apiRequest<Task>(`/tasks/${taskId}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      note: normalizedNote === '' ? null : (normalizedNote ?? null),
    }),
  });
}

export function reopenTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}/reopen`, {
    method: 'POST',
  });
}

export function cancelTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}/cancel`, {
    method: 'POST',
  });
}

export function archiveTask(taskId: string) {
  return apiRequest<Task>(`/tasks/${taskId}/archive`, {
    method: 'POST',
  });
}

export function getTaskDashboard() {
  const timezone = encodeURIComponent(browserTimezone());
  return apiRequest<TaskDashboard>(`/tasks/dashboard?timezone=${timezone}`);
}
