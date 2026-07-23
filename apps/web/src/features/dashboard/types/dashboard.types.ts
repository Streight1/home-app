export interface DashboardListItem {
  id: string;
  title: string;
  meta: string;
}

export type DashboardHouseholdRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface DashboardData {
  attention: readonly DashboardListItem[];
  agenda: readonly DashboardListItem[];
  financeSummary: string | null;
  financeMeta: string | null;
  recentDocuments: readonly DashboardListItem[];
  upcomingDeadlines: readonly DashboardListItem[];
}

export const emptyDashboardData: DashboardData = {
  attention: [],
  agenda: [],
  financeSummary: null,
  financeMeta: null,
  recentDocuments: [],
  upcomingDeadlines: [],
};
