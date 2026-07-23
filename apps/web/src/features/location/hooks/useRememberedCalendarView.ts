import { useEffect, useRef, useState } from 'react';
import {
  readCalendarPreferencesCache,
  writeCalendarPreferenceCache,
} from '../lib/calendarPreferencesCache.js';
import type { CalendarViewPreference } from '../types/location.types.js';
import { useCalendarLayoutMode } from './useCalendarLayoutMode.js';
import {
  useCalendarPreferences,
  useUpdateCalendarPreferences,
} from './useCalendarPreferences.js';
import type { CalendarViewMode } from '../../calendar/types/calendar.types.js';

const lower = (view: CalendarViewPreference): CalendarViewMode =>
  view.toLowerCase() as CalendarViewMode;
const upper = (view: CalendarViewMode): CalendarViewPreference =>
  view.toUpperCase() as CalendarViewPreference;

export function useRememberedCalendarView() {
  const layout = useCalendarLayoutMode();
  const preferences = useCalendarPreferences();
  const update = useUpdateCalendarPreferences();
  const touched = useRef(false);
  const [view, setView] = useState<CalendarViewMode>(() =>
    lower(readCalendarPreferencesCache()[layout] ?? 'MONTH'),
  );
  useEffect(() => {
    const key = `${layout}CalendarView` as const;
    const serverView = preferences.data?.[key];
    if (serverView && !touched.current) setView(lower(serverView));
  }, [layout, preferences.data]);
  const select = (next: CalendarViewMode) => {
    touched.current = true;
    setView(next);
    const value = upper(next);
    writeCalendarPreferenceCache(layout, value);
    const key = `${layout}CalendarView` as const;
    update.mutate({ [key]: value });
  };
  return { view, select, layout, saveError: update.isError };
}
