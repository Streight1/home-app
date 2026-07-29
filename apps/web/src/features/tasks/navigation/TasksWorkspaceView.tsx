import type { WorkspaceView } from '../../../app/workspace-navigation/workspace-navigation.types.js';
import type { HouseholdRole } from '../types/task.types.js';
import { TasksAreaNavigation } from '../components/navigation/TasksAreaNavigation.js';
import { TasksPage } from '../pages/TasksPage.js';
import { TaskDetailPage } from '../pages/TaskDetailPage.js';

export function TasksWorkspaceView({
  view,
  role,
}: {
  view: Extract<WorkspaceView, { area: 'tasks' }>;
  role: HouseholdRole;
}) {
  return (
    <div className="grid gap-5">
      <TasksAreaNavigation />
      {view.screen === 'list' ? (
        <TasksPage role={role} />
      ) : (
        <TaskDetailPage taskId={view.taskId} />
      )}
    </div>
  );
}
