import { useContext } from 'react';
import { WorkspaceNavigationContext } from './workspace-navigation.context.js';

export function useWorkspaceNavigation() {
  const value = useContext(WorkspaceNavigationContext);
  if (!value)
    throw new Error(
      'useWorkspaceNavigation must be used inside WorkspaceNavigationProvider.',
    );
  return value;
}
