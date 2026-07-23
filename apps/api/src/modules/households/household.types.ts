export type HouseholdRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export const calendarMemberColorTokens = [
  'violet',
  'blue',
  'cyan',
  'green',
  'amber',
  'orange',
  'rose',
  'pink',
] as const;
export type CalendarMemberColorToken =
  (typeof calendarMemberColorTokens)[number];

export const calendarMemberColorForIndex = (
  index: number,
): CalendarMemberColorToken =>
  calendarMemberColorTokens[index % calendarMemberColorTokens.length] ??
  'violet';

export interface PublicHousehold {
  id: string;
  name: string;
  role: HouseholdRole;
}
