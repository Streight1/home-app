/* global document, window */

(() => {
  const key = 'homeapp.theme';
  const allowed = new Set(['system', 'light', 'dark']);
  let preference = 'system';
  try {
    const stored = window.localStorage.getItem(key);
    if (allowed.has(stored)) preference = stored;
  } catch {
    preference = 'system';
  }
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#08070d' : '#f6f5f9');
})();
