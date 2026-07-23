import { Navigate, Outlet } from 'react-router-dom';
import { LoadingScreen } from '../../components/ui/LoadingScreen/LoadingScreen.js';
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser.js';
import { ApiError } from '../../lib/api/apiError.js';

export function ProtectedRoute() {
  const auth = useCurrentUser();
  if (auth.isPending) return <LoadingScreen />;
  if (auth.error instanceof ApiError && auth.error.status === 401)
    return <Navigate to="/login" replace />;
  if (auth.isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-md rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-text">
            Aplikaci se nepodařilo načíst
          </h1>
          <p className="mt-2 text-text-muted">
            Zkontrolujte připojení a zkuste stránku obnovit.
          </p>
        </div>
      </main>
    );
  }
  return <Outlet />;
}
