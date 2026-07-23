import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';

export function useTasksNavigation() {
  const workspace = useWorkspaceNavigation();
  return {
    openTasks: () => workspace.navigate({ area: 'tasks', screen: 'list' }),
    openTask: (taskId: string) =>
      workspace.navigate({ area: 'tasks', screen: 'detail', taskId }),
    openTaskCreate: () => workspace.openOverlay({ kind: 'task-create' }),
  };
}
