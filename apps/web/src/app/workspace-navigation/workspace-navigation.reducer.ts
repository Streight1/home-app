import type {
  WorkspaceNavigationState,
  WorkspaceOverlay,
  WorkspaceView,
} from './workspace-navigation.types.js';

export type WorkspaceNavigationAction =
  | { type: 'navigate'; view: WorkspaceView }
  | { type: 'overlay'; overlay: WorkspaceOverlay }
  | { type: 'close-overlay' }
  | { type: 'restore'; state: WorkspaceNavigationState };

export function workspaceNavigationReducer(
  state: WorkspaceNavigationState,
  action: WorkspaceNavigationAction,
): WorkspaceNavigationState {
  if (action.type === 'navigate') return { view: action.view };
  if (action.type === 'overlay') return { ...state, overlay: action.overlay };
  if (action.type === 'close-overlay') return { view: state.view };
  return action.state;
}
