import type { HouseholdRole } from '../../household/household.public.js';
import { emptyDashboardData } from '../types/dashboard.types.js';
import { DashboardWorkspaceView } from './DashboardWorkspaceView.js';

export function DashboardWorkspaceHost({
  displayName,
  householdName,
  role,
}: {
  displayName: string;
  householdName: string;
  role: HouseholdRole;
}) {
  return (
    <DashboardWorkspaceView
      displayName={displayName}
      householdName={householdName}
      role={role}
      data={emptyDashboardData}
    />
  );
}
