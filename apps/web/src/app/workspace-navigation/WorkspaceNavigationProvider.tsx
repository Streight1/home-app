import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  clearWorkspaceHistory,
  stateFromHistory,
  writeWorkspaceHistory,
} from './workspace-history.js';
import { workspaceNavigationReducer } from './workspace-navigation.reducer.js';
import {
  clearWorkspaceState,
  loadWorkspaceState,
  storeWorkspaceState,
} from './workspace-storage.js';
import type {
  WorkspaceOverlay,
  WorkspaceView,
} from './workspace-navigation.types.js';
import { WorkspaceNavigationContext } from './workspace-navigation.context.js';

export function WorkspaceNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const location = useLocation();
  const initial =
    stateFromHistory(window.history.state) ?? loadWorkspaceState();
  const [state, dispatch] = useReducer(workspaceNavigationReducer, initial);
  const overlayWasPushed = useRef(false);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const restored = stateFromHistory(event.state) ?? loadWorkspaceState();
      overlayWasPushed.current = false;
      dispatch({ type: 'restore', state: restored });
      storeWorkspaceState(restored);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/app') return;
    const current = stateFromHistory(window.history.state);
    if (!current) writeWorkspaceHistory(state, true);
    storeWorkspaceState(state);
  }, [location.pathname, state]);

  const navigate = useCallback(
    (view: WorkspaceView, options?: { replace?: boolean }) => {
      const next = { view };
      dispatch({ type: 'navigate', view });
      writeWorkspaceHistory(next, options?.replace ?? false);
      storeWorkspaceState(next);
      overlayWasPushed.current = false;
    },
    [],
  );
  const openOverlay = useCallback(
    (overlay: WorkspaceOverlay) => {
      const next = { ...state, overlay };
      dispatch({ type: 'overlay', overlay });
      writeWorkspaceHistory(next, false);
      storeWorkspaceState(next);
      overlayWasPushed.current = true;
    },
    [state],
  );
  const closeOverlay = useCallback(() => {
    if (!state.overlay) return;
    if (overlayWasPushed.current) {
      overlayWasPushed.current = false;
      window.history.back();
      return;
    }
    const next = { view: state.view };
    dispatch({ type: 'close-overlay' });
    writeWorkspaceHistory(next, true);
    storeWorkspaceState(next);
  }, [state]);
  const clear = useCallback(() => {
    clearWorkspaceState();
    clearWorkspaceHistory();
  }, []);
  const value = useMemo(
    () => ({ ...state, navigate, openOverlay, closeOverlay, clear }),
    [state, navigate, openOverlay, closeOverlay, clear],
  );
  return (
    <WorkspaceNavigationContext.Provider value={value}>
      {children}
    </WorkspaceNavigationContext.Provider>
  );
}
