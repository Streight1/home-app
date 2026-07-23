import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from '../../components/ui/LoadingScreen/LoadingScreen.js';
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser.js';

export function AnonymousRoute() {
  const auth = useCurrentUser();
  if (auth.isPending) return <LoadingScreen />;
  if (auth.isSuccess) return <Navigate to="/app" replace />;
  return <Outlet />;
}
