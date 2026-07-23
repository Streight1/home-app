import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearWorkspaceHistory,
  stateFromHistory,
  writeWorkspaceHistory,
} from './workspace-history.js';
import { workspaceNavigationReducer } from './workspace-navigation.reducer.js';
import {
  clearWorkspaceState,
  loadWorkspaceState,
  parseWorkspaceState,
  storeWorkspaceState,
  WORKSPACE_STORAGE_KEY,
} from './workspace-storage.js';

const documentId = '123e4567-e89b-42d3-a456-426614174000';

describe('workspace navigation state', () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, '', '/app');
  });

  it('uses the dashboard for missing or invalid session state', () => {
    expect(loadWorkspaceState()).toEqual({ view: { area: 'dashboard' } });
    sessionStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        view: { area: 'documents', screen: 'detail', documentId: '../secret' },
      }),
    );
    expect(loadWorkspaceState()).toEqual({ view: { area: 'dashboard' } });
  });

  it('stores only a validated namespaced workspace state', () => {
    const state = {
      view: {
        area: 'documents' as const,
        screen: 'detail' as const,
        documentId,
      },
    };
    storeWorkspaceState(state);
    expect(loadWorkspaceState()).toEqual(state);
    expect(Object.keys(sessionStorage)).toEqual([WORKSPACE_STORAGE_KEY]);
    expect(sessionStorage.getItem(WORKSPACE_STORAGE_KEY)).not.toContain(
      'token',
    );
  });

  it('keeps feature navigation on the single /app URL', () => {
    const state = {
      view: { area: 'calendar' as const, screen: 'calendar' as const },
    };
    writeWorkspaceHistory(state, false);
    expect(window.location.pathname).toBe('/app');
    expect(stateFromHistory(window.history.state)).toEqual(state);
  });

  it('rejects unknown history state and clears navigation on logout', () => {
    expect(
      stateFromHistory({ homeAppWorkspace: { view: { area: 'admin' } } }),
    ).toBeNull();
    storeWorkspaceState({ view: { area: 'tasks', screen: 'list' } });
    writeWorkspaceHistory({ view: { area: 'tasks', screen: 'list' } }, true);
    clearWorkspaceState();
    clearWorkspaceHistory();
    expect(sessionStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(stateFromHistory(window.history.state)).toBeNull();
  });

  it('closes an overlay without losing its underlying view', () => {
    const state = {
      view: { area: 'tasks' as const, screen: 'list' as const },
      overlay: { kind: 'task-create' as const },
    };
    expect(
      workspaceNavigationReducer(state, { type: 'close-overlay' }),
    ).toEqual({ view: state.view });
    expect(parseWorkspaceState(state)).toEqual(state);
  });
});
