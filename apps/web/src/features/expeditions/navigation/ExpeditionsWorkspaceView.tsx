import type { WorkspaceView } from '../../../app/workspace-navigation/workspace-navigation.types.js';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import type { HouseholdRole } from '../../household/household.public.js';
import {
  ExpeditionsPage,
  type ExpeditionsScreen,
} from '../pages/ExpeditionsPage.js';

export function ExpeditionsWorkspaceView({
  view,
  role,
}: {
  view: Extract<WorkspaceView, { area: 'expeditions' }>;
  role: HouseholdRole;
}) {
  const workspace = useWorkspaceNavigation();
  return (
    <ExpeditionsPage
      role={role}
      screen={view.screen}
      {...(view.screen === 'trip' ? { tripId: view.tripId } : {})}
      {...(view.screen === 'gear' && 'gearItemId' in view
        ? { selectedGearItemId: view.gearItemId }
        : {})}
      {...(view.screen === 'templates' && 'templateId' in view
        ? { selectedTemplateId: view.templateId }
        : {})}
      onScreenChange={(screen: ExpeditionsScreen) =>
        workspace.navigate({ area: 'expeditions', screen })
      }
    />
  );
}
