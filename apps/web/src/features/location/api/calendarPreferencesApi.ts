import { apiRequest } from '../../../lib/api/apiClient.js';
import type { CalendarPreferences } from '../types/location.types.js';

export function getCalendarPreferences() {
  return apiRequest<CalendarPreferences>('/calendar/preferences');
}
export function updateCalendarPreferences(
  input: Partial<Omit<CalendarPreferences, 'householdId' | 'userId'>>,
) {
  return apiRequest<CalendarPreferences>('/calendar/preferences', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
