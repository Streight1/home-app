import { Navigate } from 'react-router-dom';
import { LoadingScreen } from '../../components/ui/LoadingScreen/LoadingScreen.js';
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser.js';

export function RootRedirect() {
  const auth = useCurrentUser();
  if (auth.isPending) return <LoadingScreen />;
  return <Navigate to={auth.isSuccess ? '/app' : '/login'} replace />;
}
