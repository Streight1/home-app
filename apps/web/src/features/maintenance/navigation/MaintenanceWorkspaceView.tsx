import type { WorkspaceView } from '../../../app/workspace-navigation/workspace-navigation.types.js';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import type { HouseholdRole } from '../../household/household.public.js';
import { MaintenancePage } from '../pages/MaintenancePage.js';

export function MaintenanceWorkspaceView({
  view,
  role,
}: {
  view: Extract<WorkspaceView, { area: 'maintenance' }>;
  role: HouseholdRole;
}) {
  const workspace = useWorkspaceNavigation();
  return (
    <MaintenancePage
      role={role}
      screen={view.screen === 'plan' ? 'plans' : view.screen}
      initialPlanId={view.screen === 'plan' ? view.planId : null}
      onScreenChange={(screen) =>
        workspace.navigate({ area: 'maintenance', screen })
      }
      onCreate={() =>
        workspace.openOverlay({ kind: 'maintenance-plan-create' })
      }
    />
  );
}
