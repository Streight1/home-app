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

  it('keeps finance drill-down text transient while persisting safe filters', () => {
    const unsafeState = {
      view: {
        area: 'finance',
        screen: 'transactions',
        filters: {
          query: 'citlivá poznámka obchodníka',
          categoryId: documentId,
          dateFrom: '2026-07-01',
          dateTo: '2026-07-31',
        },
      },
    } as Parameters<typeof storeWorkspaceState>[0];

    storeWorkspaceState(unsafeState);
    writeWorkspaceHistory(unsafeState, true);

    const expected = {
      view: {
        area: 'finance' as const,
        screen: 'transactions' as const,
        filters: {
          categoryId: documentId,
          dateFrom: '2026-07-01',
          dateTo: '2026-07-31',
        },
      },
    };
    expect(loadWorkspaceState()).toEqual(expected);
    expect(stateFromHistory(window.history.state)).toEqual(expected);
    expect(sessionStorage.getItem(WORKSPACE_STORAGE_KEY)).not.toContain(
      'citlivá poznámka',
    );
    expect(JSON.stringify(window.history.state)).not.toContain(
      'citlivá poznámka',
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

  it('persists maintenance detail for refresh and keeps history states valid', () => {
    const maintenanceDetail = {
      view: {
        area: 'maintenance' as const,
        screen: 'plan' as const,
        planId: documentId,
      },
    };
    storeWorkspaceState(maintenanceDetail);
    writeWorkspaceHistory({ view: { area: 'tasks', screen: 'list' } }, true);
    writeWorkspaceHistory(maintenanceDetail, false);

    expect(window.location.pathname).toBe('/app');
    expect(loadWorkspaceState()).toEqual(maintenanceDetail);
    expect(stateFromHistory(window.history.state)).toEqual(maintenanceDetail);
  });

  it('validates exact gear and template search targets without exposing them in the URL', () => {
    for (const view of [
      { area: 'expeditions', screen: 'gear', gearItemId: documentId },
      { area: 'expeditions', screen: 'templates', templateId: documentId },
    ] as const) {
      const state = parseWorkspaceState({ view });
      expect(state).toEqual({ view });
      if (!state) throw new Error('Search target was not parsed.');
      writeWorkspaceHistory(state, false);
      expect(window.location.pathname).toBe('/app');
      expect(window.location.href).not.toContain(documentId);
    }
  });

  it('supports browser Back and Forward between Tasks and Maintenance', async () => {
    const tasksState = {
      view: { area: 'tasks' as const, screen: 'list' as const },
    };
    const maintenanceState = {
      view: { area: 'maintenance' as const, screen: 'overview' as const },
    };
    writeWorkspaceHistory(tasksState, true);
    writeWorkspaceHistory(maintenanceState, false);

    const back = new Promise<PopStateEvent>((resolve) =>
      window.addEventListener('popstate', (event) => resolve(event), {
        once: true,
      }),
    );
    window.history.back();
    expect(stateFromHistory((await back).state)).toEqual(tasksState);

    const forward = new Promise<PopStateEvent>((resolve) =>
      window.addEventListener('popstate', (event) => resolve(event), {
        once: true,
      }),
    );
    window.history.forward();
    expect(stateFromHistory((await forward).state)).toEqual(maintenanceState);
    expect(window.location.pathname).toBe('/app');
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

  it('validates the persisted calendar creation draft and migrates legacy dates', () => {
    expect(
      parseWorkspaceState({
        view: { area: 'calendar', screen: 'calendar' },
        overlay: {
          kind: 'calendar-create',
          draft: {
            source: 'month-day-double-click',
            date: '2026-07-29',
            startTime: '09:00',
            durationMinutes: 60,
            isAllDay: false,
          },
        },
      }),
    ).toEqual({
      view: { area: 'calendar', screen: 'calendar' },
      overlay: {
        kind: 'calendar-create',
        draft: {
          source: 'month-day-double-click',
          date: '2026-07-29',
          startTime: '09:00',
          durationMinutes: 60,
          isAllDay: false,
        },
      },
    });
    expect(
      parseWorkspaceState({
        view: { area: 'calendar', screen: 'calendar' },
        overlay: { kind: 'calendar-create', date: '2026-07-29' },
      }),
    ).toEqual({
      view: { area: 'calendar', screen: 'calendar' },
      overlay: {
        kind: 'calendar-create',
        draft: {
          source: 'calendar-toolbar',
          date: '2026-07-29',
          startTime: '09:00',
          durationMinutes: 60,
          isAllDay: false,
        },
      },
    });
    expect(
      parseWorkspaceState({
        view: { area: 'calendar', screen: 'calendar' },
        overlay: { kind: 'calendar-create', date: '2026-02-30' },
      }),
    ).toBeNull();
  });

  it('rejects impossible date-only values in persisted feature state', () => {
    expect(
      parseWorkspaceState({
        view: { area: 'meals', screen: 'planner' },
        overlay: {
          kind: 'meal-plan-edit',
          entryId: documentId,
          plannedFor: '2026-02-30',
        },
      }),
    ).toBeNull();

    expect(
      parseWorkspaceState({
        view: {
          area: 'finance',
          screen: 'transactions',
          filters: { dateFrom: '2026-02-30', dateTo: '2026-03-01' },
        },
      }),
    ).toEqual({
      view: {
        area: 'finance',
        screen: 'transactions',
        filters: { dateTo: '2026-03-01' },
      },
    });
  });
});
