import type { ComponentType } from 'react';
import { TasksWorkspaceView } from '../../features/tasks/navigation/TasksWorkspaceView.js';
import type { HouseholdRole } from '../../features/tasks/types/task.types.js';
import { CalendarWorkspaceView } from '../../features/calendar/navigation/CalendarWorkspaceView.js';
import { DashboardWorkspaceView } from '../../features/dashboard/components/DashboardWorkspaceView.js';
import { emptyDashboardData } from '../../features/dashboard/types/dashboard.types.js';
import { DocumentsWorkspaceView } from '../../features/documents/navigation/DocumentsWorkspaceView.js';
import { HouseholdSettingsPage } from '../../features/household/pages/HouseholdSettingsPage.js';
import { FinanceWorkspaceView } from '../../features/finance/navigation/FinanceWorkspaceView.js';
import type { WorkspaceView } from './workspace-navigation.types.js';
import { BucketListWorkspaceView } from '../../features/bucket-list/navigation/BucketListWorkspaceView.js';
import { MaintenanceWorkspaceView } from '../../features/maintenance/navigation/MaintenanceWorkspaceView.js';

interface AreaHostProps {
  view: WorkspaceView;
  role: HouseholdRole;
  displayName: string;
  householdName: string;
}

const hosts: Record<WorkspaceView['area'], ComponentType<AreaHostProps>> = {
  dashboard: ({ displayName, householdName, role }) => (
    <DashboardWorkspaceView
      displayName={displayName}
      householdName={householdName}
      role={role}
      data={emptyDashboardData}
    />
  ),
  documents: ({ view, role }) =>
    view.area === 'documents' ? (
      <DocumentsWorkspaceView view={view} role={role} />
    ) : null,
  tasks: ({ view, role }) =>
    view.area === 'tasks' ? (
      <TasksWorkspaceView view={view} role={role} />
    ) : null,
  calendar: ({ view, role }) =>
    view.area === 'calendar' ? (
      <CalendarWorkspaceView view={view} role={role} />
    ) : null,
  'bucket-list': ({ view, role }) =>
    view.area === 'bucket-list' ? (
      <BucketListWorkspaceView view={view} role={role} />
    ) : null,
  maintenance: ({ view, role }) =>
    view.area === 'maintenance' ? (
      <MaintenanceWorkspaceView view={view} role={role} />
    ) : null,
  finance: ({ view, role }) =>
    view.area === 'finance' ? (
      <FinanceWorkspaceView view={view} role={role} />
    ) : null,
  settings: () => <HouseholdSettingsPage />,
};

export function WorkspaceViewRegistry(props: AreaHostProps) {
  const Host = hosts[props.view.area];
  return <Host {...props} />;
}
