import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { applyTheme, resolveTheme } from '../lib/applyTheme.js';
import {
  clearThemePreference,
  readThemePreference,
  writeThemePreference,
} from '../lib/themeStorage.js';
import type {
  ThemeContextValue,
  ThemePreference,
} from '../types/theme.types.js';

const darkSchemeQuery = '(prefers-color-scheme: dark)';

function readSystemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia(darkSchemeQuery).matches
    : false;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  initialPreference?: ThemePreference;
  persist?: boolean;
}

export function ThemeProvider({
  children,
  initialPreference,
  persist = true,
}: ThemeProviderProps) {
  const [preference, setStoredPreference] = useState<ThemePreference>(
    () => initialPreference ?? readThemePreference(),
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    readSystemPrefersDark,
  );
  const resolvedTheme = resolveTheme(preference, systemPrefersDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const mediaQuery = window.matchMedia(darkSchemeQuery);
    const handleChange = (event: MediaQueryListEvent) =>
      setSystemPrefersDark(event.matches);
    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useLayoutEffect(() => {
    applyTheme(resolvedTheme, preference);
  }, [preference, resolvedTheme]);

  const setPreference = useCallback(
    (nextPreference: ThemePreference) => {
      setStoredPreference(nextPreference);
      if (persist) writeThemePreference(nextPreference);
    },
    [persist],
  );
  const resetPreference = useCallback(() => {
    setStoredPreference('system');
    if (persist) clearThemePreference();
  }, [persist]);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolvedTheme, setPreference, resetPreference }),
    [preference, resetPreference, resolvedTheme, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
