import type { ThemePreference } from '../types/theme.types.js';

export const THEME_STORAGE_KEY = 'homeapp.theme';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function readThemePreference(
  storage: Storage = window.localStorage,
): ThemePreference {
  try {
    const stored = storage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function writeThemePreference(
  preference: ThemePreference,
  storage: Storage = window.localStorage,
): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // A blocked storage must not make the interface unusable.
  }
}

export function clearThemePreference(
  storage: Storage = window.localStorage,
): void {
  try {
    storage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // A blocked storage must not make the interface unusable.
  }
}
