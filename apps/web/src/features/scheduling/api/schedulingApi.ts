import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  SchedulingInput,
  SchedulingSuggestions,
} from '../types/scheduling.types.js';

export function suggestTaskSlots(
  taskId: string,
  input: SchedulingInput,
  signal?: AbortSignal,
) {
  return apiRequest<SchedulingSuggestions>(
    `/tasks/${taskId}/scheduling/suggestions`,
    {
      method: 'POST',
      body: JSON.stringify(input),
      ...(signal ? { signal } : {}),
    },
  );
}

export function confirmTaskSlot(taskId: string, candidateToken: string) {
  return apiRequest<{ eventId: string; startsAt: string; endsAt: string }>(
    `/tasks/${taskId}/scheduling/confirm`,
    { method: 'POST', body: JSON.stringify({ candidateToken }) },
  );
}

export function unscheduleTask(taskId: string) {
  return apiRequest<undefined>(`/tasks/${taskId}/scheduling`, {
    method: 'DELETE',
  });
}
