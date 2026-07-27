import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRouter } from '../app/router.js';
import { ThemeProvider } from '../features/theme/providers/ThemeProvider.js';
import { WorkspaceNavigationProvider } from '../app/workspace-navigation/WorkspaceNavigationProvider.js';

const profile = {
  user: {
    id: 'user-1',
    email: 'jana@example.com',
    displayName: 'Jana Nováková',
    avatarUrl: null,
  },
  activeHousehold: { id: 'household-1', name: 'Moje domácnost', role: 'OWNER' },
};

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
}

function authenticatedResponse(input: RequestInfo | URL): Promise<Response> {
  const url = requestUrl(input);
  if (url.includes('/tasks/dashboard'))
    return Promise.resolve(
      jsonResponse({
        summary: {
          openTotal: 0,
          overdueTotal: 0,
          dueTodayTotal: 0,
          upcomingTotal: 0,
        },
        items: [],
      }),
    );
  if (url.includes('/calendar/dashboard'))
    return Promise.resolve(
      jsonResponse({ summary: { total: 0, ongoingTotal: 0 }, items: [] }),
    );
  if (url.includes('/finance/budgets/dashboard'))
    return Promise.resolve(
      jsonResponse({
        budgets: [],
        newInsightCount: 0,
        recurringCandidateCount: 0,
        importantInsight: null,
      }),
    );
  if (url.includes('/bucket-lists/dashboard'))
    return Promise.resolve(
      jsonResponse({
        year: 2026,
        list: null,
        progress: {
          planned: 0,
          completed: 0,
          skipped: 0,
          total: 0,
          percent: 0,
        },
        items: [],
      }),
    );
  return Promise.resolve(jsonResponse(profile));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderAt(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <ThemeProvider initialPreference="light" persist={false}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <WorkspaceNavigationProvider>
            <AppRouter />
          </WorkspaceNavigationProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('authentication UI', () => {
  it('creates the container for the official Google button', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ code: 'AUTH_INVALID_SESSION' }, 401)),
    );
    renderAt('/login');
    expect(
      await screen.findByTestId('google-button-container'),
    ).toBeInTheDocument();
    expect(document.querySelector('#google-identity-services')).toHaveAttribute(
      'src',
      'https://accounts.google.com/gsi/client',
    );
  });

  it('shows a Czech error when the Google script cannot load', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ code: 'AUTH_INVALID_SESSION' }, 401)),
    );
    renderAt('/login');
    await screen.findByTestId('google-button-container');
    const script = document.querySelector<HTMLScriptElement>(
      '#google-identity-services',
    );
    expect(script).not.toBeNull();
    if (!script) throw new Error('Google script was not created');
    fireEvent.error(script);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Přihlášení přes Google se nepodařilo načíst.',
    );
  });

  it('does not show protected content while auth/me is loading', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise<Response>(() => undefined)),
    );
    renderAt('/app');
    expect(screen.getByText('Ověřujeme přihlášení…')).toBeInTheDocument();
    expect(screen.queryByText(/Vítejte/)).not.toBeInTheDocument();
  });

  it('redirects a 401 response from auth/me to login', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ code: 'AUTH_INVALID_SESSION' }, 401)),
    );
    renderAt('/app');
    expect(
      await screen.findByRole('heading', { name: 'Centrum domácnosti' }),
    ).toBeInTheDocument();
  });

  it('shows the signed-in user and active household', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(authenticatedResponse));
    renderAt('/app');
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Dobrý den, Jana Nováková' },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Moje domácnost').length).toBeGreaterThan(0);
  });

  it('sends the CSRF header on logout and redirects to login', async () => {
    document.cookie = 'homeapp_csrf=csrf-test-value; path=/';
    let loggedOut = false;
    const fetchMock = vi
      .fn()
      .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') {
          loggedOut = true;
          return Promise.resolve(new Response(null, { status: 204 }));
        }
        if (loggedOut)
          return Promise.resolve(
            jsonResponse({ code: 'AUTH_INVALID_SESSION' }, 401),
          );
        return authenticatedResponse(input);
      });
    vi.stubGlobal('fetch', fetchMock);
    renderAt('/app');
    const userMenuButtons = await screen.findAllByRole('button', {
      name: 'Uživatelské menu: Jana Nováková',
    });
    const userMenuButton = userMenuButtons[0];
    if (!userMenuButton) throw new Error('User menu button was not rendered');
    await userEvent.click(userMenuButton);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Odhlásit se' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Centrum domácnosti' }),
      ).toBeInTheDocument(),
    );
    const logoutCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).endsWith('/auth/logout'),
    );
    expect(logoutCall).toBeDefined();
    const headers = new Headers(logoutCall?.[1]?.headers);
    expect(headers.get('X-CSRF-Token')).toBe('csrf-test-value');
  });
});
