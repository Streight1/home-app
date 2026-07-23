import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTheme } from './hooks/useTheme.js';
import { THEME_STORAGE_KEY } from './lib/themeStorage.js';
import { ThemeSelector } from './components/ThemeSelector.js';
import { ThemeProvider } from './providers/ThemeProvider.js';

function createColorSchemeController(initialDark: boolean) {
  let matches = initialDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (
      type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener: (
      type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      if (type === 'change') listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeListener: (listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
    dispatchEvent: () => true,
  } as MediaQueryList;

  window.matchMedia = () => mediaQuery;
  return {
    setDark(nextDark: boolean) {
      matches = nextDark;
      const event = { matches: nextDark, media: mediaQuery.media };
      listeners.forEach((listener) => listener(event as MediaQueryListEvent));
    },
  };
}

function ThemeProbe() {
  const theme = useTheme();
  return (
    <div>
      <output data-testid="preference">{theme.preference}</output>
      <output data-testid="resolved">{theme.resolvedTheme}</output>
      <button type="button" onClick={() => theme.setPreference('dark')}>
        Nastavit tmavý
      </button>
      <button type="button" onClick={() => theme.setPreference('light')}>
        Nastavit světlý
      </button>
    </div>
  );
}

function renderTheme() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
}

describe('HomeApp theme system', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="theme-color" content="">';
    document.documentElement.style.setProperty(
      '--color-theme-meta',
      'rgb(8, 7, 13)',
    );
  });

  it('uses system as the default and resolves both OS modes', () => {
    createColorSchemeController(false);
    renderTheme();
    expect(screen.getByTestId('preference')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    expect(document.documentElement.dataset.themePreference).toBe('system');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('starts in the dark OS mode and follows runtime OS changes', () => {
    const media = createColorSchemeController(true);
    renderTheme();
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');

    act(() => media.setDark(false));
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
    act(() => media.setDark(true));
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('keeps explicit dark and light preferences across OS changes', async () => {
    const user = userEvent.setup();
    const media = createColorSchemeController(false);
    renderTheme();

    await user.click(screen.getByRole('button', { name: 'Nastavit tmavý' }));
    act(() => media.setDark(false));
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');

    await user.click(screen.getByRole('button', { name: 'Nastavit světlý' }));
    act(() => media.setDark(true));
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });

  it('stores only the namespaced theme preference', async () => {
    const user = userEvent.setup();
    createColorSchemeController(false);
    renderTheme();
    await user.click(screen.getByRole('button', { name: 'Nastavit tmavý' }));

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(Object.keys(window.localStorage)).toEqual([THEME_STORAGE_KEY]);
    expect(
      Object.keys(window.localStorage).some((key) =>
        /auth|session|token|credential/i.test(key),
      ),
    ).toBe(false);
  });

  it('falls back from an invalid stored value to system', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'aurora');
    createColorSchemeController(true);
    renderTheme();
    expect(screen.getByTestId('preference')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('updates theme-color with the active theme', () => {
    createColorSchemeController(true);
    renderTheme();
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      'rgb(8, 7, 13)',
    );
  });

  it('announces and changes the active selector value accessibly', async () => {
    const user = userEvent.setup();
    createColorSchemeController(false);
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>,
    );
    expect(screen.getByRole('radio', { name: 'Podle systému' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Tmavý' }));
    expect(screen.getByRole('radio', { name: 'Tmavý' })).toBeChecked();
    expect(screen.getByText('Aktivní vzhled: tmavý.')).toBeVisible();
  });
});
