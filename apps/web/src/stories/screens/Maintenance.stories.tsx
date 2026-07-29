import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../../layouts/AppShell/AppShell.js';
import { MaintenanceDashboardWidget } from '../../features/maintenance/components/dashboard/MaintenanceDashboardWidget.js';
import { MaintenancePlanDetail } from '../../features/maintenance/components/detail/MaintenancePlanDetail.js';
import { MaintenanceOccurrenceDialog } from '../../features/maintenance/components/dialogs/MaintenanceOccurrenceDialog.js';
import { MaintenancePlanDialog } from '../../features/maintenance/components/dialogs/MaintenancePlanDialog.js';
import { MaintenancePage } from '../../features/maintenance/pages/MaintenancePage.js';
import type {
  MaintenanceDashboard,
  MaintenanceOccurrence,
  MaintenancePlan,
} from '../../features/maintenance/types/maintenance.types.js';

const member = {
  id: '82000000-0000-4000-8000-000000000001',
  email: 'jana@example.test',
  displayName: 'Jana Nováková',
  avatarUrl: null,
  role: 'OWNER',
  calendarColorToken: 'rose',
} as const;

const plan: MaintenancePlan = {
  id: '82000000-0000-4000-8000-000000000002',
  title: 'Revize kotle',
  description: 'Pravidelná odborná kontrola před topnou sezonou.',
  instructions: 'Zkontrolovat tlak a doložit servisní zprávu.',
  priority: 'HIGH',
  status: 'ACTIVE',
  recurrence: {
    frequency: 'YEARLY',
    interval: 1,
    monthOfYear: 10,
    dayOfMonth: 1,
  },
  recurrenceBasis: 'FROM_SCHEDULED_DATE',
  startsOn: '2026-08-15',
  endsOn: null,
  nextDueOn: '2026-08-15',
  overdue: true,
  leadDays: 21,
  estimatedDurationMinutes: 60,
  preferredStartTime: null,
  locationLabel: 'Technická místnost',
  providerName: 'Servisní technik',
  defaultCost: { amountMinor: '125000', currencyCode: 'CZK' },
  autoCreateTask: true,
  taskCreateDaysBefore: 21,
  category: {
    id: '82000000-0000-4000-8000-000000000003',
    name: 'Topení a kotel',
    iconKey: 'flame',
    colorToken: 'orange',
  },
  responsible: {
    id: member.id,
    displayName: member.displayName,
    avatarUrl: null,
  },
  occurrenceCount: 2,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-07-29T10:00:00.000Z',
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
      nextDueOn: plan.nextDueOn ?? '2026-08-15',
      priority: plan.priority,
      overdue: plan.overdue,
      category: plan.category,
      responsible: plan.responsible,
      permissions: { canComplete: true },
      navigationTarget: { area: 'maintenance', screen: 'plans' },
    },
  ],
  recentlyCompleted: {
    occurrenceId: '82000000-0000-4000-8000-000000000004',
    planId: plan.id,
    title: 'Čištění pračky',
    completedOn: '2026-07-25',
    completedAt: '2026-07-25T10:00:00.000Z',
    completedBy: plan.responsible,
  },
};

const occurrence: MaintenanceOccurrence = {
  id: '82000000-0000-4000-8000-000000000006',
  plan: {
    id: plan.id,
    title: plan.title,
    priority: plan.priority,
    status: plan.status,
    category: plan.category,
    responsible: plan.responsible,
  },
  scheduledFor: '2026-08-15',
  originalScheduledFor: '2026-08-15',
  status: 'TASK_CREATED',
  taskId: '82000000-0000-4000-8000-000000000007',
  completedOn: null,
  completedAt: null,
  completionNotes: null,
  skipReason: null,
  providerName: plan.providerName,
  actualCost: null,
  documents: [],
  transactions: [],
  permissions: { canMutate: true },
};

const completedOccurrence: MaintenanceOccurrence = {
  ...occurrence,
  id: '82000000-0000-4000-8000-000000000008',
  scheduledFor: '2026-07-25',
  originalScheduledFor: '2026-07-25',
  status: 'COMPLETED',
  taskId: null,
  completedOn: '2026-07-25',
  completedAt: '2026-07-25T10:00:00.000Z',
  completionNotes: 'Kontrola proběhla bez závad.',
  actualCost: { amountMinor: '125000', currencyCode: 'CZK' },
  permissions: { canMutate: false },
};

function installFixture(empty: boolean) {
  window.fetch = (input) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const requestUrl = new URL(url, window.location.origin);
    const path = requestUrl.pathname;
    const body = path.endsWith('/auth/me')
      ? {
          user: member,
          activeHousehold: {
            id: '82000000-0000-4000-8000-000000000005',
            name: 'Moje domácnost',
            role: 'OWNER',
          },
        }
      : path.endsWith('/household/members')
        ? [member]
        : path.endsWith(`/maintenance/plans/${plan.id}`)
          ? plan
          : path.endsWith('/maintenance/occurrences') ||
              path.endsWith('/maintenance/history')
            ? {
                items: empty
                  ? []
                  : path.endsWith('/maintenance/history')
                    ? [completedOccurrence]
                    : [occurrence],
                pagination: {
                  page: 1,
                  pageSize: path.endsWith('/maintenance/history') ? 100 : 50,
                  totalItems: empty ? 0 : 1,
                  totalPages: empty ? 0 : 1,
                },
              }
            : path.endsWith('/maintenance/dashboard')
              ? empty
                ? { ...dashboard, items: [], recentlyCompleted: null }
                : dashboard
              : path.endsWith('/maintenance/categories')
                ? { items: empty ? [] : [plan.category] }
                : path.endsWith('/maintenance/plans')
                  ? {
                      items: empty ? [] : [plan],
                      pagination: {
                        page: 1,
                        pageSize: 20,
                        totalItems: empty ? 0 : 1,
                        totalPages: empty ? 0 : 1,
                      },
                    }
                  : { items: [] };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
}

function MaintenanceScreen({
  empty = false,
  screen = 'overview',
}: {
  empty?: boolean;
  screen?: 'overview' | 'plans' | 'history';
}) {
  installFixture(empty);
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <MaintenancePage
        role="OWNER"
        screen={screen}
        onScreenChange={() => undefined}
        onCreate={() => undefined}
      />
    </AppShell>
  );
}

function MaintenanceDetailScreen() {
  installFixture(false);
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <MaintenancePlanDetail planId={plan.id} onAction={() => undefined} />
    </AppShell>
  );
}

function MaintenanceDialogScreen({
  action,
}: {
  action: 'plan' | 'complete' | 'skip' | 'reschedule';
}) {
  installFixture(false);
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="rounded-lg border border-border bg-surface-raised p-6">
        <h1 className="text-page-title font-semibold">Údržba domácnosti</h1>
      </div>
      {action === 'plan' ? (
        <MaintenancePlanDialog open onOpenChange={() => undefined} />
      ) : (
        <MaintenanceOccurrenceDialog
          occurrence={occurrence}
          action={action}
          onClose={() => undefined}
        />
      )}
    </AppShell>
  );
}

function MaintenanceDashboardScreen() {
  installFixture(false);
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <MaintenanceDashboardWidget />
      </div>
    </AppShell>
  );
}

const meta = {
  title: 'Screens/Maintenance',
  component: MaintenanceScreen,
  parameters: { route: '/app', workspace: 'maintenance' },
} satisfies Meta<typeof MaintenanceScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OverviewLight: Story = {
  parameters: { theme: 'light' },
};

export const OverviewDark: Story = {
  parameters: { theme: 'dark' },
};

export const PlansLight: Story = {
  args: { screen: 'plans' },
  parameters: { theme: 'light' },
};

export const EmptyDark: Story = {
  args: { empty: true, screen: 'plans' },
  parameters: { theme: 'dark' },
};

export const HistoryLight: Story = {
  args: { screen: 'history' },
  parameters: { theme: 'light' },
};

export const DetailLight: Story = {
  render: () => <MaintenanceDetailScreen />,
  parameters: { theme: 'light' },
};

export const CreatePlanDialog: Story = {
  render: () => <MaintenanceDialogScreen action="plan" />,
  parameters: { theme: 'light' },
};

export const CompleteOccurrenceDialog: Story = {
  render: () => <MaintenanceDialogScreen action="complete" />,
  parameters: { theme: 'light' },
};

export const SkipOccurrenceDialog: Story = {
  render: () => <MaintenanceDialogScreen action="skip" />,
  parameters: { theme: 'dark' },
};

export const RescheduleOccurrenceDialog: Story = {
  render: () => <MaintenanceDialogScreen action="reschedule" />,
  parameters: { theme: 'light' },
};

export const DashboardWidgetLight: Story = {
  render: () => <MaintenanceDashboardScreen />,
  parameters: { theme: 'light' },
};
