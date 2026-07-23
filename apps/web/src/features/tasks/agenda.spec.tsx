import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskCompleteDialog } from './components/dialogs/TaskCompleteDialog.js';
import { TasksDashboardWidget } from './components/dashboard/TasksDashboardWidget.js';
import { TaskForm } from './components/forms/TaskForm.js';
import { TaskList } from './components/list/TaskList.js';
import { formatTaskDue } from './lib/taskDate.js';
import { TasksPage } from './pages/TasksPage.js';
import type { Task, TaskDashboard, TaskMember } from './types/task.types.js';
import { WorkspaceNavigationProvider } from '../../app/workspace-navigation/WorkspaceNavigationProvider.js';

const taskMemberFixture: TaskMember = {
  id: '20000000-0000-4000-8000-000000000002',
  displayName: 'Jana',
  email: 'jana@example.test',
  avatarUrl: null,
  role: 'MEMBER',
  calendarColorToken: 'violet',
};

const taskFixture: Task = {
  id: '10000000-0000-4000-8000-000000000001',
  title: 'Revize kotle',
  description: 'Objednat každoroční kontrolu',
  status: 'OPEN',
  priority: 'HIGH',
  timing: 'TODAY',
  assignedTo: {
    id: '20000000-0000-4000-8000-000000000002',
    displayName: 'Jana',
    email: 'jana@example.test',
    avatarUrl: null,
  },
  participants: [taskMemberFixture],
  estimatedDurationMinutes: 60,
  location: null,
  category: null,
  dueDate: '2026-07-15',
  dueTimeMinutes: 1080,
  dueAt: '2026-07-15T16:00:00.000Z',
  isAllDay: false,
  timezone: 'Europe/Prague',
  recurrence: {
    frequency: 'NONE',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    monthOfYear: null,
    endsAt: null,
    nextOccurrenceAt: null,
    nextOccurrenceDate: null,
  },
  completedAt: null,
  cancelledAt: null,
  archivedAt: null,
  createdAt: '2026-07-15T10:00:00.000Z',
  updatedAt: '2026-07-15T10:00:00.000Z',
  createdBy: {
    id: '20000000-0000-4000-8000-000000000002',
    displayName: 'Jana',
    email: 'jana@example.test',
    avatarUrl: null,
  },
  documents: [],
  documentCount: 0,
  calendarSchedule: null,
  completions: [],
  permissions: {
    canEdit: true,
    canComplete: true,
    canReopen: false,
    canCancel: true,
    canArchive: true,
    canSchedule: true,
    canUnschedule: false,
  },
};

function json(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function list(items: Task[] = []) {
  return {
    items,
    pagination: {
      page: 1,
      pageSize: 20,
      totalItems: items.length,
      totalPages: items.length ? 1 : 0,
    },
    members: [taskFixture.assignedTo],
  };
}

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
}

function dashboard(items: Task[] = []): TaskDashboard {
  return {
    summary: {
      openTotal: items.length,
      overdueTotal: items.filter((task) => task.timing === 'OVERDUE').length,
      dueTodayTotal: items.filter((task) => task.timing === 'TODAY').length,
      upcomingTotal: items.filter((task) => task.timing === 'UPCOMING').length,
    },
    items: items.map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      dueTimeMinutes: task.dueTimeMinutes,
      dueAt: task.dueAt,
      isAllDay: task.isAllDay,
      priority: task.priority,
      assignedTo: task.assignedTo,
      participants: task.participants,
      isRecurring: task.recurrence.frequency !== 'NONE',
      isOverdue: task.timing === 'OVERDUE',
      permissions: { canComplete: task.permissions.canComplete },
      navigationTarget: { area: 'tasks', screen: 'detail', taskId: task.id },
    })),
  };
}

function mockApi(items: Task[] = []) {
  vi.mocked(fetch).mockImplementation((input, init) => {
    const url = requestUrl(input);
    if (url.includes('/tasks/categories')) return json([]);
    if (url.includes('/tasks/dashboard')) return json(dashboard(items));
    if (url.includes('/tasks') && (init?.method ?? 'GET') === 'GET')
      return json(list(items));
    if (url.includes('/tasks')) return json(taskFixture);
    return json({}, 404);
  });
}

function renderClient(element: ReactElement, path = '/app/agenda') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <WorkspaceNavigationProvider>{element}</WorkspaceNavigationProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('agenda frontend', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('shows a truthful empty agenda state', async () => {
    mockApi();
    renderClient(<TasksPage role="MEMBER" />);
    expect(
      await screen.findByText('Tady je zatím hotovo.'),
    ).toBeInTheDocument();
  });

  it('renders today tasks and an understandable overdue state', async () => {
    mockApi([
      { ...taskFixture, timing: 'OVERDUE', dueAt: '2026-07-12T10:00:00.000Z' },
    ]);
    renderClient(<TasksPage role="MEMBER" />);
    expect(await screen.findAllByText('Revize kotle')).toHaveLength(2);
    expect(screen.getAllByText(/Po termínu/).length).toBeGreaterThan(0);
  });

  it('does not render a desktop table in the responsive task list', () => {
    renderClient(
      <TaskList
        tasks={[taskFixture]}
        completingId={null}
        onComplete={() => undefined}
      />,
    );
    expect(
      screen.getByRole('list', { name: 'Seznam úkolů' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('uses one shared form schema and requires a weekly day', async () => {
    const submit = vi.fn();
    renderClient(
      <TaskForm
        members={[
          {
            ...taskMemberFixture,
            role: 'MEMBER',
          },
        ]}
        categories={[]}
        onSubmit={submit}
        onCancel={() => undefined}
      />,
    );
    await userEvent.type(screen.getByLabelText('Název'), 'Vynést koš');
    await userEvent.selectOptions(screen.getByLabelText('Frekvence'), 'WEEKLY');
    await userEvent.click(screen.getByRole('button', { name: 'Dnes' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Vytvořit úkol' }),
    );
    expect(screen.getByText('Vyberte alespoň jeden den.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it('changes recurrence controls according to frequency', async () => {
    renderClient(
      <TaskForm
        members={[]}
        categories={[]}
        quick={false}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(screen.queryByLabelText('Den v měsíci')).not.toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByLabelText('Frekvence'),
      'MONTHLY',
    );
    expect(screen.getByLabelText('Den v měsíci')).toBeInTheDocument();
  });

  it('opens an accessible calendar date picker', async () => {
    renderClient(
      <TaskForm
        members={[taskMemberFixture]}
        categories={[]}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Vybrat datum/ }));
    expect(
      screen.getByRole('grid', { name: 'Kalendář termínu' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Předchozí měsíc' }),
    ).toBeInTheDocument();
  });

  it('submits a date-only deadline and supports its quick actions', async () => {
    const submit = vi.fn();
    renderClient(
      <TaskForm
        members={[taskMemberFixture]}
        categories={[]}
        onSubmit={submit}
        onCancel={() => undefined}
      />,
    );
    await userEvent.type(screen.getByLabelText('Název'), 'Datum bez času');
    await userEvent.click(screen.getByRole('button', { name: 'Dnes' }));
    fireEvent.change(screen.getByLabelText(/^Čas \(volitelný\)/), {
      target: { value: '18:30' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Bez času' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Vytvořit úkol' }),
    );
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        dueDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        dueTimeMinutes: null,
      }),
    );
  });

  it('clears both date and time without inventing midnight', async () => {
    const submit = vi.fn();
    renderClient(
      <TaskForm
        members={[taskMemberFixture]}
        categories={[]}
        onSubmit={submit}
        onCancel={() => undefined}
      />,
    );
    await userEvent.type(screen.getByLabelText('Název'), 'Bez termínu');
    await userEvent.click(screen.getByRole('button', { name: 'Dnes' }));
    fireEvent.change(screen.getByLabelText(/^Čas \(volitelný\)/), {
      target: { value: '08:00' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Vymazat termín' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Vytvořit úkol' }),
    );
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: null, dueTimeMinutes: null }),
    );
  });

  it('never formats a date-only deadline as 00:00', () => {
    const label = formatTaskDue({
      dueDate: '2030-07-17',
      dueTimeMinutes: null,
      timing: 'UPCOMING',
    });
    expect(label).not.toContain('00:00');
    expect(label).toContain('17.');
  });

  it.each([
    ['30 min', 30],
    ['1 h', 60],
    ['1 h 30 min', 90],
    ['2 h', 120],
  ])('sets duration preset %s without submitting', async (label, minutes) => {
    const submit = vi.fn();
    renderClient(
      <TaskForm
        members={[taskMemberFixture]}
        categories={[]}
        onSubmit={submit}
        onCancel={() => undefined}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: label }));
    expect(
      screen.getByLabelText(/^Předpokládaná délka v minutách/),
    ).toHaveValue(minutes);
    expect(submit).not.toHaveBeenCalled();
  });

  it('keeps a custom duration and deactivates all presets', () => {
    renderClient(
      <TaskForm
        members={[taskMemberFixture]}
        categories={[]}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    fireEvent.change(screen.getByLabelText(/^Předpokládaná délka v minutách/), {
      target: { value: '75' },
    });
    expect(
      screen.getByLabelText(/^Předpokládaná délka v minutách/),
    ).toHaveValue(75);
    for (const label of ['30 min', '1 h', '1 h 30 min', '2 h'])
      expect(screen.getByRole('button', { name: label })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
  });

  it('loads the explicit dashboard contract without list parameters', async () => {
    mockApi([taskFixture]);
    renderClient(<TasksDashboardWidget />);
    expect(await screen.findByText('Otevřené: 1')).toBeInTheDocument();
    const dashboardCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) =>
        requestUrl(input).includes('/tasks/dashboard'),
      );
    expect(requestUrl(dashboardCall?.[0] ?? '')).toContain(
      '/tasks/dashboard?timezone=',
    );
    expect(requestUrl(dashboardCall?.[0] ?? '')).not.toContain('page=');
  });

  it('distinguishes dashboard errors from an empty state and retries', async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() =>
        json({ code: 'TASK_INVALID_INPUT', message: 'Dočasná chyba.' }, 400),
      )
      .mockImplementation(() => json(dashboard()));
    renderClient(<TasksDashboardWidget />);
    expect(await screen.findByText('Dočasná chyba.')).toBeInTheDocument();
    expect(
      screen.queryByText('Nemáte žádné otevřené úkoly.'),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Zkusit znovu' }));
    expect(
      await screen.findByText('Nemáte žádné otevřené úkoly.'),
    ).toBeInTheDocument();
  });

  it('quick create sends normalized task data once', async () => {
    mockApi();
    const user = userEvent.setup();
    renderClient(
      <TaskForm
        members={[
          {
            ...taskMemberFixture,
            role: 'MEMBER',
          },
        ]}
        categories={[]}
        quick
        onSubmit={(input) =>
          void fetch('/tasks', {
            method: 'POST',
            body: JSON.stringify(input),
          })
        }
        onCancel={() => undefined}
      />,
    );
    await user.type(screen.getByLabelText('Název'), '  Vynést koš  ');
    await user.click(screen.getByRole('button', { name: 'Vytvořit úkol' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const request = vi.mocked(fetch).mock.calls[0]?.[1];
    const body = request?.body;
    if (typeof body !== 'string')
      throw new Error('Expected JSON request body.');
    expect(JSON.parse(body) as unknown).toMatchObject({
      title: 'Vynést koš',
      priority: 'NORMAL',
      recurrenceFrequency: 'NONE',
    });
  });

  it('viewer sees tasks but no mutation actions', async () => {
    const viewerTask = {
      ...taskFixture,
      permissions: {
        canEdit: false,
        canComplete: false,
        canReopen: false,
        canCancel: false,
        canArchive: false,
        canSchedule: false,
        canUnschedule: false,
      },
    };
    mockApi([viewerTask]);
    renderClient(<TasksPage role="VIEWER" />);
    expect(await screen.findAllByText('Revize kotle')).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: 'Nový úkol' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Dokončit' }),
    ).not.toBeInTheDocument();
  });

  it('uses all as the default view and changes listing filters internally', async () => {
    mockApi();
    renderClient(<TasksPage role="MEMBER" />, '/app');
    await screen.findByText('Tady je zatím hotovo.');
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([url]) => requestUrl(url).includes('view=all')),
    ).toBe(true);
    await userEvent.click(screen.getByRole('tab', { name: 'Po termínu' }));
    await waitFor(() =>
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(
            ([url]) =>
              requestUrl(url).includes('view=overdue') &&
              requestUrl(url).includes('page=1'),
          ),
      ).toBe(true),
    );
  });

  it('shows the next occurrence before completing a recurring task', () => {
    renderClient(
      <TaskCompleteDialog
        task={{
          ...taskFixture,
          recurrence: {
            ...taskFixture.recurrence,
            frequency: 'DAILY',
            nextOccurrenceAt: '2026-07-16T16:00:00.000Z',
          },
        }}
        open
        onOpenChange={() => undefined}
      />,
    );
    expect(screen.getByText(/Další termín:/)).toBeInTheDocument();
  });

  it('ends loading and shows a safe API error', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      json(
        { code: 'DATABASE_UNAVAILABLE', message: 'Agenda není dostupná.' },
        503,
      ),
    );
    renderClient(<TasksPage role="MEMBER" />);
    expect(
      await screen.findByText('Agenda není dostupná.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Načítáme agendu…')).not.toBeInTheDocument();
  });
});
