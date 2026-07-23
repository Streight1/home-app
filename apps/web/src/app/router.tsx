import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingScreen } from '../components/ui/LoadingScreen/LoadingScreen.js';
import { AnonymousRoute } from './routes/AnonymousRoute.js';
import { ProtectedRoute } from './routes/ProtectedRoute.js';
import { RootRedirect } from './routes/RootRedirect.js';

const LoginPage = lazy(async () => ({
  default: (await import('../features/auth/pages/LoginPage.js')).LoginPage,
}));
const WorkspacePage = lazy(async () => ({
  default: (await import('./workspace-navigation/WorkspacePage.js'))
    .WorkspacePage,
}));

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen message="Načítáme aplikaci…" />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route element={<AnonymousRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<WorkspacePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
