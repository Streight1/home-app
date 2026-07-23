import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { AppShell } from '../../../layouts/AppShell/AppShell.js';
import type { DashboardData } from '../types/dashboard.types.js';
import type { TaskDashboard } from '../../tasks/tasks.public.js';
import type { CalendarDashboard } from '../../calendar/calendar.public.js';
import { DashboardHeader } from './DashboardHeader.js';
import { DashboardOverview } from './DashboardOverview.js';

interface DashboardViewProps {
  displayName: string;
  householdName: string;
  avatarUrl: string | null;
  data: DashboardData;
  isLoggingOut?: boolean;
  logoutError?: string | null;
  onLogout?: () => void;
  tasksDashboard?: TaskDashboard;
  calendarDashboard?: CalendarDashboard;
}

export function DashboardView({
  displayName,
  householdName,
  avatarUrl,
  data,
  isLoggingOut = false,
  logoutError = null,
  onLogout = () => undefined,
  tasksDashboard,
  calendarDashboard,
}: DashboardViewProps) {
  return (
    <AppShell
      householdName={householdName}
      avatarUrl={avatarUrl}
      displayName={displayName}
      isLoggingOut={isLoggingOut}
      onLogout={onLogout}
    >
      <DashboardHeader
        displayName={displayName}
        householdName={householdName}
      />
      {logoutError ? (
        <div className="mb-5">
          <InlineAlert variant="danger">{logoutError}</InlineAlert>
        </div>
      ) : null}
      <DashboardOverview
        data={data}
        {...(tasksDashboard ? { tasksDashboard } : {})}
        {...(calendarDashboard ? { calendarDashboard } : {})}
      />
    </AppShell>
  );
}
