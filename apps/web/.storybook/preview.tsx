import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Decorator, Preview } from '@storybook/react-vite';
import { useMemo, useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WorkspaceNavigationContext } from '../src/app/workspace-navigation/workspace-navigation.context.js';
import type {
  WorkspaceNavigationState,
  WorkspaceNavigationValue,
  WorkspaceView,
} from '../src/app/workspace-navigation/workspace-navigation.types.js';
import { ThemeProvider } from '../src/features/theme/providers/ThemeProvider.js';
import type { ThemePreference } from '../src/features/theme/types/theme.types.js';
import { installTestPublicRuntimeConfig } from '../src/lib/config/test-runtime-config.js';
import '../src/styles/globals.css';

installTestPublicRuntimeConfig({ APP_ENV_LABEL: '' });

function StoryQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function StoryWorkspaceProvider({
  initialView,
  children,
}: {
  initialView: WorkspaceView;
  children: ReactNode;
}) {
  const [state, setState] = useState<WorkspaceNavigationState>({
    view: initialView,
  });
  const value = useMemo<WorkspaceNavigationValue>(
    () => ({
      ...state,
      navigate: (view) => setState({ view }),
      openOverlay: (overlay) =>
        setState((current) => ({ ...current, overlay })),
      closeOverlay: () =>
        setState((current) => ({
          view: current.view,
        })),
      clear: () => setState({ view: initialView }),
    }),
    [initialView, state],
  );
  return (
    <WorkspaceNavigationContext.Provider value={value}>
      {children}
    </WorkspaceNavigationContext.Provider>
  );
}

const withAppProviders: Decorator = (Story, context) => {
  const requestedTheme: unknown = context.parameters.theme;
  const initialPreference: ThemePreference =
    requestedTheme === 'light' || requestedTheme === 'dark'
      ? requestedTheme
      : 'system';
  const requestedRoute: unknown = context.parameters.route;
  const initialRoute =
    typeof requestedRoute === 'string' ? requestedRoute : '/app';
  const requestedWorkspace: unknown = context.parameters.workspace;
  const workspaceView =
    requestedWorkspace === 'tasks'
      ? ({ area: 'tasks', screen: 'list' } as const)
      : requestedWorkspace === 'calendar'
        ? ({ area: 'calendar', screen: 'calendar' } as const)
        : requestedWorkspace === 'documents'
          ? ({ area: 'documents', screen: 'list' } as const)
          : requestedWorkspace === 'finance'
            ? ({ area: 'finance', screen: 'overview' } as const)
            : requestedWorkspace === 'bucket-list'
              ? ({ area: 'bucket-list', screen: 'overview' } as const)
              : requestedWorkspace === 'maintenance'
                ? ({ area: 'maintenance', screen: 'overview' } as const)
                : requestedWorkspace === 'meals'
                  ? ({ area: 'meals', screen: 'planner' } as const)
                  : ({ area: 'dashboard' } as const);
  return (
    <ThemeProvider
      initialPreference={initialPreference}
      persist={false}
      key={context.id}
    >
      <StoryQueryProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <StoryWorkspaceProvider initialView={workspaceView} key={context.id}>
            <Story />
          </StoryWorkspaceProvider>
        </MemoryRouter>
      </StoryQueryProvider>
    </ThemeProvider>
  );
};

interface StorybookGoogleWindow extends Window {
  google?: {
    accounts: {
      id: {
        initialize: () => void;
        renderButton: (parent: HTMLElement) => void;
        cancel: () => void;
      };
    };
  };
}

const storybookWindow = window as StorybookGoogleWindow;
storybookWindow.google = {
  accounts: {
    id: {
      initialize: () => undefined,
      renderButton: (parent: HTMLElement) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className =
          'min-h-11 w-full rounded-md border border-border-strong bg-surface px-4 text-body-sm font-medium text-text hover:bg-surface-hover';
        button.textContent = 'Přihlásit se přes Google';
        parent.append(button);
      },
      cancel: () => undefined,
    },
  },
};

const preview: Preview = {
  decorators: [withAppProviders],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    a11y: { test: 'error' },
    options: {
      storySort: { order: ['Foundations', 'Components', 'Layouts', 'Screens'] },
    },
  },
};

export default preview;
