import { InlineAlert } from '../../components/ui/InlineAlert/InlineAlert.js';
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser.js';
import { useLogout } from '../../features/auth/hooks/useLogout.js';
import { AppShell } from '../../layouts/AppShell/AppShell.js';
import { ApiError } from '../../lib/api/apiError.js';
import { WorkspaceOverlayHost } from './WorkspaceOverlayHost.js';
import { WorkspaceViewRegistry } from './workspace-view-registry.js';
import { useWorkspaceNavigation } from './useWorkspaceNavigation.js';

export function WorkspacePage() {
  const auth = useCurrentUser();
  const logout = useLogout();
  const workspace = useWorkspaceNavigation();
  if (!auth.data) return null;
  const { user, activeHousehold } = auth.data;
  const displayName = user.displayName ?? user.email;
  const logoutError = logout.isError
    ? logout.error instanceof ApiError
      ? logout.error.message
      : 'Odhlášení se nepodařilo. Zkuste to znovu.'
    : null;
  return (
    <AppShell
      householdName={activeHousehold.name}
      avatarUrl={user.avatarUrl}
      displayName={displayName}
      isLoggingOut={logout.isPending}
      onLogout={() => logout.mutate()}
    >
      {logoutError ? (
        <div className="mb-5">
          <InlineAlert variant="danger">{logoutError}</InlineAlert>
        </div>
      ) : null}
      <WorkspaceViewRegistry
        view={workspace.view}
        role={activeHousehold.role}
        displayName={displayName}
        householdName={activeHousehold.name}
      />
      <WorkspaceOverlayHost role={activeHousehold.role} />
    </AppShell>
  );
}
