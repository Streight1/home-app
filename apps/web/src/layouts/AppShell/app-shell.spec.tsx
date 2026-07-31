import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
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
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' = 'OWNER',
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(AUTH_QUERY_KEY, {
    ...profile,
    activeHousehold: { ...profile.activeHousehold, role },
  });
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

  it.each([
    { key: 'k', ctrlKey: true, metaKey: false },
    { key: 'k', ctrlKey: false, metaKey: true },
  ])(
    'opens and closes the command palette from the keyboard',
    async (shortcut) => {
      renderShell();
      window.dispatchEvent(new KeyboardEvent('keydown', shortcut));
      expect(
        await screen.findByRole('dialog', { name: 'Hledat v aplikaci' }),
      ).toBeInTheDocument();
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: 'Hledat v aplikaci' }),
        ).not.toBeInTheDocument(),
      );
    },
  );

  it('debounces a POST body search, opens an internal target and keeps /app URL semantics', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          partial: false,
          unavailableProviders: [],
          groups: [
            {
              key: 'tasks',
              label: 'Úkoly a údržba',
              total: 1,
              items: [
                {
                  resultId: 'tasks:TASK:30000000-0000-4000-8000-000000000003',
                  providerKey: 'tasks',
                  entityKind: 'TASK',
                  title: 'Revize kotle',
                  matchedField: 'Název',
                  iconKey: 'task',
                  score: 1,
                  navigationTarget: {
                    area: 'tasks',
                    screen: 'detail',
                    taskId: '30000000-0000-4000-8000-000000000003',
                  },
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const { workspace } = renderShell();
    const searchButton = screen.getAllByRole('button', {
      name: /Hledat v aplikaci/,
    })[0];
    if (!searchButton) throw new Error('Search trigger was not rendered.');
    await userEvent.click(searchButton);
    await userEvent.type(
      screen.getByRole('combobox', { name: 'Hledat v aplikaci' }),
      'revize',
    );
    await screen.findByText('Revize kotle');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchMock.mock.calls[0] ?? [];
    const url =
      typeof requestUrl === 'string'
        ? requestUrl
        : requestUrl instanceof URL
          ? requestUrl.href
          : requestUrl?.url;
    const body =
      typeof requestInit?.body === 'string' ? requestInit.body : undefined;
    expect(url).toMatch(/\/api\/v1\/search$/);
    expect(url).not.toContain('revize');
    expect(requestInit).toMatchObject({ method: 'POST', cache: 'no-store' });
    expect(body).toContain('revize');
    await userEvent.keyboard('{Enter}');
    expect(workspace.navigate).toHaveBeenCalledWith({
      area: 'tasks',
      screen: 'detail',
      taskId: '30000000-0000-4000-8000-000000000003',
    });
    expect(window.location.pathname).not.toContain('revize');
  });

  it('hides create commands from VIEWER while keeping navigation commands', async () => {
    renderShell({ area: 'dashboard' }, 'VIEWER');
    expect(
      screen.queryByRole('button', { name: 'Přidat' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Rychlé přidání' }),
    ).not.toBeInTheDocument();
    const searchButton = screen.getAllByRole('button', {
      name: /Hledat v aplikaci/,
    })[0];
    if (!searchButton) throw new Error('Search trigger was not rendered.');
    await userEvent.click(searchButton);
    expect(
      screen.getByRole('option', { name: /Přejít na Úkoly/ }),
    ).toBeVisible();
    expect(
      screen.queryByRole('option', { name: /Nový úkol/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /Nová výprava/ }),
    ).not.toBeInTheDocument();
  });

  it('exposes semantic result headings and includes Show all in arrow navigation', async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            partial: false,
            unavailableProviders: [],
            groups: [
              {
                key: 'tasks',
                label: 'Úkoly a údržba',
                total: 2,
                items: [
                  {
                    resultId: 'tasks:TASK:30000000-0000-4000-8000-000000000003',
                    providerKey: 'tasks',
                    entityKind: 'TASK',
                    title: 'Revize kotle',
                    matchedField: 'Název',
                    iconKey: 'task',
                    score: 1,
                    navigationTarget: {
                      area: 'tasks',
                      screen: 'detail',
                      taskId: '30000000-0000-4000-8000-000000000003',
                    },
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    renderShell();
    const searchButton = screen.getAllByRole('button', {
      name: /Hledat v aplikaci/,
    })[0];
    if (!searchButton) throw new Error('Search trigger was not rendered.');
    await userEvent.click(searchButton);
    const input = screen.getByRole('combobox', { name: 'Hledat v aplikaci' });
    await userEvent.type(input, 'revize');

    expect(
      await screen.findByRole('group', {
        name: 'Úkoly a údržba, počet výsledků: 2',
      }),
    ).toBeVisible();
    await userEvent.keyboard('{ArrowDown}');
    const showAll = screen.getByRole('option', {
      name: 'Zobrazit vše v oblasti Úkoly a údržba',
    });
    expect(showAll).toHaveAttribute('aria-selected', 'true');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });

    await userEvent.keyboard('{Enter}');
    expect(
      screen
        .getAllByRole('button', { name: 'Úkoly a údržba' })
        .some((button) => button.getAttribute('aria-pressed') === 'true'),
    ).toBe(true);
  });

  it('keeps available results visible when one provider reports a partial failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          partial: true,
          unavailableProviders: ['documents'],
          groups: [
            {
              key: 'tasks',
              label: 'Úkoly a údržba',
              total: 1,
              items: [
                {
                  resultId: 'tasks:TASK:30000000-0000-4000-8000-000000000003',
                  providerKey: 'tasks',
                  entityKind: 'TASK',
                  title: 'Revize kotle',
                  matchedField: 'Název',
                  iconKey: 'task',
                  score: 1,
                  navigationTarget: {
                    area: 'tasks',
                    screen: 'detail',
                    taskId: '30000000-0000-4000-8000-000000000003',
                  },
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    renderShell();
    const searchButton = screen.getAllByRole('button', {
      name: /Hledat v aplikaci/,
    })[0];
    if (!searchButton) throw new Error('Search trigger was not rendered.');
    await userEvent.click(searchButton);
    await userEvent.type(
      screen.getByRole('combobox', { name: 'Hledat v aplikaci' }),
      'revize',
    );
    expect(await screen.findByText('Revize kotle')).toBeVisible();
    expect(
      screen.getByText(/Některé oblasti dočasně neodpověděly/),
    ).toBeVisible();
  });

  it('aborts an obsolete debounced search request', async () => {
    const signals: AbortSignal[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      if (init?.signal) signals.push(init.signal);
      return new Promise<Response>(() => undefined);
    });
    renderShell();
    const searchButton = screen.getAllByRole('button', {
      name: /Hledat v aplikaci/,
    })[0];
    if (!searchButton) throw new Error('Search trigger was not rendered.');
    await userEvent.click(searchButton);
    const input = screen.getByRole('combobox', { name: 'Hledat v aplikaci' });
    await userEvent.type(input, 're');
    await waitFor(() => expect(signals).toHaveLength(1));
    await userEvent.type(input, 'v');
    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0]?.aborted).toBe(true);
  });
});
