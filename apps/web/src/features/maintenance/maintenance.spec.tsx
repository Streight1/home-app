import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseWorkspaceState } from '../../app/workspace-navigation/workspace-storage.js';
import { MaintenanceDashboardWidget } from './components/dashboard/MaintenanceDashboardWidget.js';
import { MaintenanceTaskContextCard } from './components/task-context/MaintenanceTaskContextCard.js';
import { MaintenancePlanCard } from './components/list/MaintenancePlanCard.js';
import { MaintenanceRecurrenceFields } from './components/forms/MaintenanceRecurrenceFields.js';
import {
  formatMaintenanceDate,
  formatMaintenanceRecurrence,
} from './lib/maintenanceFormat.js';
import type {
  MaintenanceDashboard,
  MaintenancePlan,
} from './types/maintenance.types.js';

const workspace = vi.hoisted(() => ({
  navigate: vi.fn(),
  openOverlay: vi.fn(),
  closeOverlay: vi.fn(),
  view: { area: 'dashboard' as const },
}));

vi.mock('../../app/workspace-navigation/useWorkspaceNavigation.js', () => ({
  useWorkspaceNavigation: () => workspace,
}));

function renderClient(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

const plan: MaintenancePlan = {
  id: '10000000-0000-4000-8000-000000000001',
  title: 'Revize kotle',
  description: 'Pravidelná odborná kontrola.',
  instructions: null,
  priority: 'HIGH',
  status: 'ACTIVE',
  recurrence: { frequency: 'MONTHLY', interval: 3, dayOfMonth: 15 },
  recurrenceBasis: 'FROM_SCHEDULED_DATE',
  startsOn: '2026-08-15',
  endsOn: null,
  nextDueOn: '2026-08-15',
  overdue: false,
  leadDays: 14,
  estimatedDurationMinutes: 60,
  preferredStartTime: null,
  locationLabel: 'Technická místnost',
  providerName: null,
  defaultCost: { amountMinor: '125000', currencyCode: 'CZK' },
  autoCreateTask: true,
  taskCreateDaysBefore: 14,
  category: {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Topení a kotel',
    iconKey: 'flame',
    colorToken: 'orange',
  },
  responsible: {
    id: '10000000-0000-4000-8000-000000000003',
    displayName: 'Adam',
    avatarUrl: null,
  },
  occurrenceCount: 1,
  createdAt: '2026-07-29T08:00:00.000Z',
  updatedAt: '2026-07-29T08:00:00.000Z',
  permissions: { canEdit: true, canComplete: true, canArchive: true },
};

const dashboard: MaintenanceDashboard = {
  summary: {
    overdueTotal: 1,
    dueTodayTotal: 0,
    dueWithinSevenDaysTotal: 1,
    dueWithinThirtyDaysTotal: 2,
    pausedTotal: 1,
  },
  items: [
    {
      id: plan.id,
      title: plan.title,
      nextDueOn: '2026-08-15',
      priority: 'HIGH',
      overdue: false,
      category: plan.category,
      responsible: plan.responsible,
      permissions: { canComplete: true },
      navigationTarget: { area: 'maintenance', screen: 'plans' },
    },
  ],
  recentlyCompleted: null,
};

describe('maintenance UI', () => {
  beforeEach(() => {
    workspace.navigate.mockReset();
    workspace.openOverlay.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('formats date-only and every-three-month recurrence deterministically', () => {
    expect(formatMaintenanceDate('2026-08-15')).toMatch(/15. srpna 2026/);
    expect(formatMaintenanceRecurrence(plan.recurrence)).toBe('Každé 3 měsíce');
  });

  it('renders a mobile-safe plan card without a wide table', () => {
    const { container } = render(
      <MaintenancePlanCard
        plan={plan}
        busy={false}
        onOpen={vi.fn()}
        onTransition={vi.fn()}
      />,
    );
    expect(screen.getByText('Revize kotle')).toBeInTheDocument();
    expect(screen.getByText('Technická místnost')).toBeInTheDocument();
    expect(container.querySelector('table')).toBeNull();
  });

  it('lets users configure a three-month recurrence', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MaintenanceRecurrenceFields
        value={{ frequency: 'ONCE', interval: 1 }}
        onChange={onChange}
      />,
    );
    await user.selectOptions(screen.getByLabelText('Frekvence'), 'MONTHLY');
    expect(onChange).toHaveBeenCalledWith({
      frequency: 'MONTHLY',
      interval: 1,
    });
  });

  it('renders real dashboard counts and opens the central create overlay', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(dashboard), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const user = userEvent.setup();
    renderClient(<MaintenanceDashboardWidget />);
    expect(await screen.findByText('Revize kotle')).toBeInTheDocument();
    expect(screen.getByText('Po termínu').nextSibling).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: 'Přidat plán' }));
    expect(workspace.openOverlay).toHaveBeenCalledWith({
      kind: 'maintenance-plan-create',
    });
  });

  it('uses a true empty state without fixture items', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ ...dashboard, items: [], recentlyCompleted: null }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    renderClient(<MaintenanceDashboardWidget />);
    expect(
      await screen.findByText('Nemáte žádnou nadcházející údržbu'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Revize kotle')).not.toBeInTheDocument();
  });

  it('does not expose create controls to a viewer', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ...dashboard, items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    renderClient(<MaintenanceDashboardWidget canWrite={false} />);
    await waitFor(() =>
      expect(screen.queryByText('Načítáme údržbu…')).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', { name: 'Přidat plán' }),
    ).not.toBeInTheDocument();
  });

  it('keeps maintenance workspace state under the single /app shell', () => {
    expect(
      parseWorkspaceState({
        view: { area: 'maintenance', screen: 'history' },
        overlay: { kind: 'maintenance-plan-create' },
      }),
    ).toEqual({
      view: { area: 'maintenance', screen: 'history' },
      overlay: { kind: 'maintenance-plan-create' },
    });
  });

  it('offers maintenance completion after a linked task is completed', async () => {
    const user = userEvent.setup();
    const navigationTarget = {
      area: 'maintenance' as const,
      screen: 'plan' as const,
      planId: plan.id,
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          occurrenceId: '10000000-0000-4000-8000-000000000004',
          planId: plan.id,
          planTitle: plan.title,
          planStatus: 'ACTIVE',
          occurrenceStatus: 'TASK_CREATED',
          scheduledFor: plan.startsOn,
          permissions: { canComplete: true },
          navigationTarget,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    renderClient(
      <MaintenanceTaskContextCard taskId={plan.id} taskCompleted={true} />,
    );
    const action = await screen.findByRole('button', {
      name: 'Dokončit záznam údržby',
    });
    await user.click(action);
    expect(workspace.navigate).toHaveBeenCalledWith(navigationTarget);
  });
});
