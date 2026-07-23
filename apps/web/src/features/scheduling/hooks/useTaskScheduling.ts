import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  confirmTaskSlot,
  suggestTaskSlots,
  unscheduleTask,
} from '../api/schedulingApi.js';
import type { SchedulingInput } from '../types/scheduling.types.js';

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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}

export function useUnscheduleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unscheduleTask,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
