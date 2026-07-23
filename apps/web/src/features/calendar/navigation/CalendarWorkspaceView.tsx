import type { WorkspaceView } from '../../../app/workspace-navigation/workspace-navigation.types.js';
import type { HouseholdRole } from '../../household/household.public.js';
import { CalendarEventDetailPage } from '../pages/CalendarEventDetailPage.js';
import { CalendarPage } from '../pages/CalendarPage.js';

export function CalendarWorkspaceView({
  view,
  role,
}: {
  view: Extract<WorkspaceView, { area: 'calendar' }>;
  role: HouseholdRole;
}) {
  return view.screen === 'calendar' ? (
    <CalendarPage role={role} />
  ) : (
    <CalendarEventDetailPage eventId={view.eventId} />
  );
}
