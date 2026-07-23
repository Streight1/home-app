import { ApiError } from '../../../lib/api/apiError.js';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser.js';
import { useLogout } from '../../auth/hooks/useLogout.js';
import { DashboardView } from '../components/DashboardView.js';
import { emptyDashboardData } from '../types/dashboard.types.js';

export function DashboardPage() {
  const auth = useCurrentUser();
  const logout = useLogout();
  const profile = auth.data;
  if (!profile) return null;
  const displayName = profile.user.displayName ?? profile.user.email;
  const logoutError = logout.isError
    ? logout.error instanceof ApiError
      ? logout.error.message
      : 'Odhlášení se nepodařilo. Zkuste to znovu.'
    : null;

  return (
    <DashboardView
      displayName={displayName}
      householdName={profile.activeHousehold.name}
      avatarUrl={profile.user.avatarUrl}
      data={emptyDashboardData}
      isLoggingOut={logout.isPending}
      logoutError={logoutError}
      onLogout={() => logout.mutate()}
    />
  );
}
