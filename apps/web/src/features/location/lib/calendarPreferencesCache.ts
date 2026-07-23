import type {
  CalendarLayoutMode,
  CalendarViewPreference,
} from '../types/location.types.js';

export const CALENDAR_PREFERENCES_CACHE_KEY =
  'homeapp.calendar.preferences.cache';
type ViewCache = Partial<Record<CalendarLayoutMode, CalendarViewPreference>>;

export function readCalendarPreferencesCache(): ViewCache {
  try {
    const value = JSON.parse(
      localStorage.getItem(CALENDAR_PREFERENCES_CACHE_KEY) ?? '{}',
    ) as Record<string, unknown>;
    const result: ViewCache = {};
    for (const layout of ['compact', 'medium', 'expanded'] as const) {
      const view = value[layout];
      if (
        view === 'MONTH' ||
        view === 'WEEK' ||
        view === 'DAY' ||
        view === 'AGENDA'
      )
        result[layout] = view;
    }
    return result;
  } catch {
    return {};
  }
}
export function writeCalendarPreferenceCache(
  layout: CalendarLayoutMode,
  view: CalendarViewPreference,
) {
  const cache = readCalendarPreferencesCache();
  localStorage.setItem(
    CALENDAR_PREFERENCES_CACHE_KEY,
    JSON.stringify({ ...cache, [layout]: view }),
  );
}
