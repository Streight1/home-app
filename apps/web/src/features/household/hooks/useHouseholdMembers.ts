import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getHouseholdMembers,
  updateHouseholdMemberCalendarColor,
  type CalendarMemberColorToken,
} from '../api/householdApi.js';

export function useHouseholdMembers() {
  return useQuery({
    queryKey: ['household', 'members'],
    queryFn: getHouseholdMembers,
  });
}

export function useUpdateMemberCalendarColor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      calendarColorToken,
    }: {
      userId: string;
      calendarColorToken: CalendarMemberColorToken;
    }) => updateHouseholdMemberCalendarColor(userId, calendarColorToken),
    onSuccess: (members) => {
      client.setQueryData(['household', 'members'], members);
      void client.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}
