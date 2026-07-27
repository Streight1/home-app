import { AppErrorBoundary } from './AppErrorBoundary.js';
import { AppProviders } from './providers/AppProviders.js';
import { RuntimeConfigGuard } from './providers/RuntimeConfigGuard.js';
import { AppRouter } from './router.js';

export function App() {
  return (
    <AppErrorBoundary>
      <RuntimeConfigGuard>
        <AppProviders>
          <AppRouter />
        </AppProviders>
      </RuntimeConfigGuard>
    </AppErrorBoundary>
  );
}
