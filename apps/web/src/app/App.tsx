import { AppErrorBoundary } from './AppErrorBoundary.js';
import { AppProviders } from './providers/AppProviders.js';
import { AppRouter } from './router.js';

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </AppErrorBoundary>
  );
}
