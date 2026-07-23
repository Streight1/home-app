import type { WorkspaceNavigationState } from './workspace-navigation.types.js';
import { parseWorkspaceState } from './workspace-storage.js';

const HISTORY_KEY = 'homeAppWorkspace';

export function stateFromHistory(
  value: unknown,
): WorkspaceNavigationState | null {
  if (typeof value !== 'object' || value === null || !(HISTORY_KEY in value))
    return null;
  return parseWorkspaceState(
    (value as Record<typeof HISTORY_KEY, unknown>)[HISTORY_KEY],
  );
}

export function writeWorkspaceHistory(
  state: WorkspaceNavigationState,
  replace: boolean,
): void {
  const historyState = { [HISTORY_KEY]: state };
  if (replace) window.history.replaceState(historyState, '', '/app');
  else window.history.pushState(historyState, '', '/app');
}

export function clearWorkspaceHistory(): void {
  if (window.location.pathname === '/app')
    window.history.replaceState({}, '', '/app');
}
