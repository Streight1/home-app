import type {
  DashboardData,
  DashboardHouseholdRole,
} from '../types/dashboard.types.js';
import type { TaskDashboard } from '../../tasks/tasks.public.js';
import { TasksDashboardWidget } from '../../tasks/tasks.public.js';
import { AttentionPanel } from './AttentionPanel.js';
import { FinanceDashboardWidget } from '../../finance/finance.public.js';
import { QuickActions } from './QuickActions.js';
import { RecentDocuments } from './RecentDocuments.js';
import { UpcomingDeadlines } from './UpcomingDeadlines.js';
import { TodayCalendarWidget } from '../../calendar/calendar.public.js';
import type { CalendarDashboard } from '../../calendar/calendar.public.js';
import { FinanceBudgetDashboardWidget } from '../../finance-budgets/finance-budgets.public.js';
import { BucketListDashboardWidget } from '../../bucket-list/bucket-list.public.js';
import { MaintenanceDashboardWidget } from '../../maintenance/maintenance.public.js';

export function DashboardOverview({
  data,
  tasksDashboard,
  calendarDashboard,
  role = 'MEMBER',
}: {
  data: DashboardData;
  tasksDashboard?: TaskDashboard;
  calendarDashboard?: CalendarDashboard;
  role?: DashboardHouseholdRole;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
      <AttentionPanel items={data.attention} />
      <QuickActions />
      <TasksDashboardWidget
        {...(tasksDashboard ? { initialData: tasksDashboard } : {})}
      />
      <TodayCalendarWidget
        {...(calendarDashboard ? { initialData: calendarDashboard } : {})}
        canWrite={role !== 'VIEWER'}
      />
      <FinanceDashboardWidget canWrite={role !== 'VIEWER'} />
      <FinanceBudgetDashboardWidget />
      <BucketListDashboardWidget />
      <MaintenanceDashboardWidget canWrite={role !== 'VIEWER'} />
      {data.recentDocuments.length > 0 ? (
        <RecentDocuments items={data.recentDocuments} />
      ) : null}
      {data.upcomingDeadlines.length > 0 ? (
        <UpcomingDeadlines items={data.upcomingDeadlines} />
      ) : null}
    </div>
  );
}
