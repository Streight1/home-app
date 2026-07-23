import type { WorkspaceView } from '../../../app/workspace-navigation/workspace-navigation.types.js';
import type { HouseholdRole } from '../../household/household.public.js';
import { BucketListItemPage } from '../pages/BucketListItemPage.js';
import { BucketListPage } from '../pages/BucketListPage.js';

export function BucketListWorkspaceView({
  view,
  role,
}: {
  view: Extract<WorkspaceView, { area: 'bucket-list' }>;
  role: HouseholdRole;
}) {
  return view.screen === 'overview' ? (
    <BucketListPage role={role} />
  ) : (
    <BucketListItemPage itemId={view.itemId} />
  );
}
