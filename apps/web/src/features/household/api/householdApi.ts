import { apiRequest } from '../../../lib/api/apiClient.js';

export interface HouseholdMemberSummary {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: HouseholdRole;
  calendarColorToken?: CalendarMemberColorToken;
}

export type HouseholdRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type CalendarMemberColorToken =
  | 'violet'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'pink';

export function getHouseholdMembers() {
  return apiRequest<HouseholdMemberSummary[]>('/household/members');
}

export function updateHouseholdMemberCalendarColor(
  userId: string,
  calendarColorToken: CalendarMemberColorToken,
) {
  return apiRequest<HouseholdMemberSummary[]>(
    `/household/members/${userId}/calendar-color`,
    { method: 'PATCH', body: JSON.stringify({ calendarColorToken }) },
  );
}
