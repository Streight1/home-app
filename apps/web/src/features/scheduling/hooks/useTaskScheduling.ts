import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  confirmTaskSlot,
  suggestTaskSlots,
  unscheduleTask,
} from '../api/schedulingApi.js';
import type { SchedulingInput } from '../types/scheduling.types.js';
import { CALENDAR_QUERY_KEY } from '../../calendar/calendar-query.public.js';
import { TASKS_QUERY_KEY } from '../../tasks/tasks-query.public.js';

function refreshTaskSchedule(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY }),
  ]);
}

export function useTaskSlotSuggestions() {
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  return useMutation({
    mutationFn: ({
      taskId,
      input,
    }: {
      taskId: string;
      input: SchedulingInput;
    }) => {
      request.current?.abort();
      request.current = new AbortController();
      return suggestTaskSlots(taskId, input, request.current.signal);
    },
  });
}

export function useConfirmTaskSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      candidateToken,
    }: {
      taskId: string;
      candidateToken: string;
    }) => confirmTaskSlot(taskId, candidateToken),
    onSuccess: () => refreshTaskSchedule(queryClient),
  });
}

export function useUnscheduleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unscheduleTask,
    onSuccess: () => refreshTaskSchedule(queryClient),
  });
}
