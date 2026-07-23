import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCalendarPreferences,
  updateCalendarPreferences,
} from '../api/calendarPreferencesApi.js';

export function useCalendarPreferences() {
  return useQuery({
    queryKey: ['calendar', 'preferences'],
    queryFn: getCalendarPreferences,
  });
}
export function useUpdateCalendarPreferences() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateCalendarPreferences,
    onSuccess: (value) => {
      client.setQueryData(['calendar', 'preferences'], value);
      void client.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}
