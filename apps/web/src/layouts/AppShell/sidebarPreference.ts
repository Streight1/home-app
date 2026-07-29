export const SIDEBAR_PREFERENCE_KEY = 'homeapp.navigation.sidebar.v1';

export function readSidebarCollapsed(
  storage: Storage = window.localStorage,
): boolean {
  try {
    return storage.getItem(SIDEBAR_PREFERENCE_KEY) === 'collapsed';
  } catch {
    return false;
  }
}

export function storeSidebarCollapsed(
  collapsed: boolean,
  storage: Storage = window.localStorage,
): void {
  try {
    storage.setItem(
      SIDEBAR_PREFERENCE_KEY,
      collapsed ? 'collapsed' : 'expanded',
    );
  } catch {
    // A blocked storage API must not make navigation unusable.
  }
}
