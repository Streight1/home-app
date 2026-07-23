import type { TaskDashboard } from '../../tasks/tasks.public.js';
import type {
  DashboardData,
  DashboardHouseholdRole,
} from '../types/dashboard.types.js';
import { DashboardHeader } from './DashboardHeader.js';
import { DashboardOverview } from './DashboardOverview.js';

export function DashboardWorkspaceView({
  displayName,
  householdName,
  role,
  data,
  tasksDashboard,
}: {
  displayName: string;
  householdName: string;
  role: DashboardHouseholdRole;
  data: DashboardData;
  tasksDashboard?: TaskDashboard;
}) {
  return (
    <>
      <DashboardHeader
        displayName={displayName}
        householdName={householdName}
      />
      <DashboardOverview
        data={data}
        role={role}
        {...(tasksDashboard ? { tasksDashboard } : {})}
      />
    </>
  );
}
