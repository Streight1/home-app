import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../features/theme/providers/ThemeProvider.js';
import { QueryProvider } from './QueryProvider.js';
import { WorkspaceNavigationProvider } from '../workspace-navigation/WorkspaceNavigationProvider.js';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <BrowserRouter>
          <WorkspaceNavigationProvider>{children}</WorkspaceNavigationProvider>
        </BrowserRouter>
      </QueryProvider>
    </ThemeProvider>
  );
}
