import { lazy, Suspense } from 'react';
import type { HouseholdRole } from '../../features/household/household.public.js';
import { loadLazyModuleWithRecovery } from './lazy-module-recovery.js';
import type { WorkspaceView } from './workspace-navigation.types.js';

interface AreaHostProps {
  view: WorkspaceView;
  role: HouseholdRole;
  displayName: string;
  householdName: string;
}

const DashboardWorkspaceHost = lazy(async () =>
  loadLazyModuleWithRecovery('workspace-dashboard', async () => ({
    default: (await import('../../features/dashboard/dashboard.public.js'))
      .DashboardWorkspaceHost,
  })),
);
const TasksWorkspaceView = lazy(async () =>
  loadLazyModuleWithRecovery('workspace-tasks', async () => ({
    default: (await import('../../features/tasks/tasks.public.js'))
      .TasksWorkspaceView,
  })),
);
const CalendarWorkspaceView = lazy(async () =>
  loadLazyModuleWithRecovery('workspace-calendar', async () => ({
    default: (await import('../../features/calendar/calendar.public.js'))
      .CalendarWorkspaceView,
  })),
);
const DocumentsWorkspaceView = lazy(async () =>
  loadLazyModuleWithRecovery('workspace-documents', async () => ({
    default: (await import('../../features/documents/documents.public.js'))
      .DocumentsWorkspaceView,
  })),
);
const HouseholdSettingsPage = lazy(async () =>
  loadLazyModuleWithRecovery('workspace-household-settings', async () => ({
    default: (await import('../../features/household/household.public.js'))
      .HouseholdSettingsPage,
  })),
);
const FinanceWorkspaceView = lazy(async () =>
  loadLazyModuleWithRecovery('workspace-finance', async () => ({
    default: (await import('../../features/finance/finance.public.js'))
      .FinanceWorkspaceView,
  })),
);
const BucketListWorkspaceView = lazy(async () =>
  loadLazyModuleWithRecovery('workspace-bucket-list', async () => ({
    default: (await import('../../features/bucket-list/bucket-list.public.js'))
      .BucketListWorkspaceView,
  })),
);
const MaintenanceWorkspaceView = lazy(async () =>
  loadLazyModuleWithRecovery('workspace-maintenance', async () => ({
    default: (await import('../../features/maintenance/maintenance.public.js'))
      .MaintenanceWorkspaceView,
  })),
);
const MealsWorkspaceView = lazy(async () =>
  loadLazyModuleWithRecovery('workspace-meals', async () => ({
    default: (await import('../../features/meals/meals.public.js'))
      .MealsWorkspaceView,
  })),
);
const ExpeditionsWorkspaceView = lazy(async () =>
  loadLazyModuleWithRecovery('workspace-expeditions', async () => ({
    default: (await import('../../features/expeditions/expeditions.public.js'))
      .ExpeditionsWorkspaceView,
  })),
);

function renderWorkspace({
  view,
  role,
  displayName,
  householdName,
}: AreaHostProps) {
  switch (view.area) {
    case 'dashboard':
      return (
        <DashboardWorkspaceHost
          displayName={displayName}
          householdName={householdName}
          role={role}
        />
      );
    case 'documents':
      return <DocumentsWorkspaceView view={view} role={role} />;
    case 'tasks':
      return <TasksWorkspaceView view={view} role={role} />;
    case 'calendar':
      return <CalendarWorkspaceView view={view} role={role} />;
    case 'bucket-list':
      return <BucketListWorkspaceView view={view} role={role} />;
    case 'maintenance':
      return <MaintenanceWorkspaceView view={view} role={role} />;
    case 'meals':
      return <MealsWorkspaceView view={view} role={role} />;
    case 'expeditions':
      return <ExpeditionsWorkspaceView view={view} role={role} />;
    case 'finance':
      return <FinanceWorkspaceView view={view} role={role} />;
    case 'settings':
      return <HouseholdSettingsPage />;
  }
}

export function WorkspaceViewRegistry(props: AreaHostProps) {
  return (
    <Suspense
      fallback={
        <div
          className="py-12 text-center text-sm text-text-muted"
          role="status"
        >
          Načítáme obsah…
        </div>
      }
    >
      {renderWorkspace(props)}
    </Suspense>
  );
}
