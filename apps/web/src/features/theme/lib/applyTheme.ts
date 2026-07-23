import type { ResolvedTheme, ThemePreference } from '../types/theme.types.js';

const themeColorSelector = 'meta[name="theme-color"]';

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  return preference === 'system'
    ? systemPrefersDark
      ? 'dark'
      : 'light'
    : preference;
}

export function applyTheme(
  resolvedTheme: ResolvedTheme,
  preference: ThemePreference,
  documentRoot: Document = document,
): void {
  const root = documentRoot.documentElement;
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;

  const themeColor = documentRoot.defaultView
    ?.getComputedStyle(root)
    .getPropertyValue('--color-theme-meta')
    .trim();
  if (themeColor)
    documentRoot
      .querySelector(themeColorSelector)
      ?.setAttribute('content', themeColor);
}
