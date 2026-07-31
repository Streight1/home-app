import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceNavigationContext } from '../../app/workspace-navigation/workspace-navigation.context.js';
import type { WorkspaceNavigationValue } from '../../app/workspace-navigation/workspace-navigation.types.js';
import { AUTH_QUERY_KEY } from '../../features/auth/hooks/useCurrentUser.js';
import { TodayCalendarWidget } from '../../features/calendar/components/dashboard/TodayCalendarWidget.js';
import { ThemeProvider } from '../../features/theme/providers/ThemeProvider.js';
import { AppShell } from './AppShell.js';
import {
  readSidebarCollapsed,
  SIDEBAR_PREFERENCE_KEY,
} from './sidebarPreference.js';

const profile = {
  user: {
    id: '10000000-0000-4000-8000-000000000001',
    email: 'jana@example.test',
    displayName: 'Jana',
    avatarUrl: null,
  },
  activeHousehold: {
    id: '20000000-0000-4000-8000-000000000002',
    name: 'Domov',
    role: 'OWNER' as const,
  },
};

function renderShell(
  view: WorkspaceNavigationValue['view'] = {
    area: 'tasks',
    screen: 'list',
  },
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(AUTH_QUERY_KEY, profile);
  const workspace: WorkspaceNavigationValue = {
    view,
    navigate: vi.fn(),
    openOverlay: vi.fn(),
    closeOverlay: vi.fn(),
    clear: vi.fn(),
  };
  const result = render(
    <QueryClientProvider client={client}>
      <ThemeProvider initialPreference="light" persist={false}>
        <MemoryRouter>
          <WorkspaceNavigationContext.Provider value={workspace}>
            <AppShell
              householdName="Domov"
              displayName="Jana"
              avatarUrl={null}
              isLoggingOut={false}
              onLogout={() => undefined}
            >
              <h1>Obsah</h1>
            </AppShell>
          </WorkspaceNavigationContext.Provider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { ...result, workspace, client };
}

describe('application shell navigation', () => {
  beforeEach(() => localStorage.clear());

  it('collapses, persists and restores the desktop sidebar', async () => {
    const first = renderShell();
    await userEvent.click(
      screen.getByRole('button', { name: 'Sbalit hlavní menu' }),
    );
    expect(readSidebarCollapsed()).toBe(true);
    expect(localStorage.getItem(SIDEBAR_PREFERENCE_KEY)).toBe('collapsed');
    expect(
      screen.getByRole('button', { name: 'Rozbalit hlavní menu' }),
    ).toBeInTheDocument();
    first.unmount();

    renderShell();
    expect(
      screen.getByRole('button', { name: 'Rozbalit hlavní menu' }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Rozbalit hlavní menu' }),
    );
    expect(readSidebarCollapsed()).toBe(false);
    expect(
      screen.getByRole('button', { name: 'Sbalit hlavní menu' }),
    ).toBeInTheDocument();
  });

  it('keeps the brand and collapse controls as separate homepage actions', async () => {
    const { workspace } = renderShell();
    const brand = screen.getAllByRole('button', {
      name: 'Přejít na domovskou stránku',
    })[0];
    if (!brand) throw new Error('Homepage brand action was not rendered.');
    await userEvent.click(brand);
    expect(workspace.navigate).toHaveBeenCalledWith({ area: 'dashboard' });
    expect(screen.getByRole('button', { name: 'Sbalit hlavní menu' })).not.toBe(
      brand,
    );
    expect(window.location.pathname).not.toContain('dashboard');
  });

  it('offers the shared calendar event dialog from the global Add action', async () => {
    const { workspace } = renderShell();
    await userEvent.click(screen.getByRole('button', { name: 'Přidat' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Nová událost' }),
    );
    expect(workspace.openOverlay).toHaveBeenCalledWith({
      kind: 'calendar-create',
      draft: expect.objectContaining({
        source: 'global-add',
        isAllDay: false,
        durationMinutes: 60,
      }),
    });
  });

  it('keeps Tasks active while a maintenance workspace is open', () => {
    renderShell({ area: 'maintenance', screen: 'history' });
    const tasksActions = screen.getAllByRole('button', { name: 'Úkoly' });
    expect(tasksActions.length).toBeGreaterThan(0);
    for (const action of tasksActions) {
      expect(action).toHaveAttribute('aria-current', 'page');
    }
    expect(
      screen.queryByRole('button', { name: 'Údržba' }),
    ).not.toBeInTheDocument();
  });

  it('does not expose maintenance as a separate item in the mobile More sheet', async () => {
    renderShell({ area: 'maintenance', screen: 'overview' });
    await userEvent.click(screen.getByRole('button', { name: 'Více oblastí' }));
    const sheet = screen.getByRole('dialog', { name: 'Další oblasti' });
    expect(
      within(sheet).queryByRole('button', { name: 'Údržba' }),
    ).not.toBeInTheDocument();
  });

  it('opens maintenance quick create without changing the current workspace', async () => {
    const { workspace } = renderShell({ area: 'finance', screen: 'overview' });
    await userEvent.click(screen.getByRole('button', { name: 'Přidat' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Nový plán údržby' }),
    );
    expect(workspace.openOverlay).toHaveBeenCalledWith({
      kind: 'maintenance-plan-create',
    });
    expect(workspace.navigate).not.toHaveBeenCalled();
  });

  it('opens expedition and gear creation from the shared Add action', async () => {
    const { workspace } = renderShell({ area: 'finance', screen: 'overview' });
    await userEvent.click(screen.getByRole('button', { name: 'Přidat' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Nová výprava' }),
    );
    expect(workspace.openOverlay).toHaveBeenCalledWith({ kind: 'trip-create' });
    expect(workspace.navigate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Přidat' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Nová položka výbavy' }),
    );
    expect(workspace.openOverlay).toHaveBeenCalledWith({
      kind: 'gear-item-create',
    });
  });

  it('opens the same event overlay from the homepage calendar widget', async () => {
    const { workspace, client } = renderShell({ area: 'dashboard' });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <WorkspaceNavigationContext.Provider value={workspace}>
            <TodayCalendarWidget
              initialData={{
                summary: { total: 0, ongoingTotal: 0 },
                items: [],
              }}
            />
          </WorkspaceNavigationContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const create = screen.getAllByRole('button', {
      name: 'Nová událost',
    })[0];
    if (!create) throw new Error('Dashboard create action was not rendered.');
    await userEvent.click(create);
    expect(workspace.openOverlay).toHaveBeenCalledWith({
      kind: 'calendar-create',
      draft: expect.objectContaining({ source: 'dashboard' }),
    });
  });
});
