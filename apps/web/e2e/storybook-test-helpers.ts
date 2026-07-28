import { expect, type Page } from '@playwright/test';

const fixedTime = new Date('2026-07-15T10:00:00+02:00');

export const fontMetrics = {
  text: 'Příliš žluťoučký kůň 0123456789',
  family: 'Inter',
  sizePx: 16,
  weight: 400,
} as const;

interface OpenStoryOptions {
  disableAnimations?: boolean;
}

export async function openStory(
  page: Page,
  storyId: string,
  options: OpenStoryOptions = {},
): Promise<void> {
  await page.clock.setFixedTime(fixedTime);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://api.mapy.com/img/api/logo.svg', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="30"/>',
    }),
  );
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
  await page.locator('#storybook-root').waitFor({ state: 'visible' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
  if (options.disableAnimations) {
    await page.addStyleTag({
      content:
        '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
    });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
  }
}

export function openVisualStory(page: Page, storyId: string): Promise<void> {
  return openStory(page, storyId, { disableAnimations: true });
}

export async function assertCanonicalInterFont(page: Page): Promise<{
  fontFamily: string;
  fontLoaded: boolean;
  width: number;
  height: number;
}> {
  return page.evaluate(async (metrics) => {
    await document.fonts.load(
      `${String(metrics.weight)} ${String(metrics.sizePx)}px ${metrics.family}`,
      metrics.text,
    );
    const probe = document.createElement('span');
    probe.textContent = metrics.text;
    Object.assign(probe.style, {
      position: 'absolute',
      visibility: 'hidden',
      whiteSpace: 'nowrap',
      fontFamily: metrics.family,
      fontSize: `${String(metrics.sizePx)}px`,
      fontWeight: String(metrics.weight),
      fontStyle: 'normal',
      letterSpacing: 'normal',
    });
    document.body.append(probe);
    const rect = probe.getBoundingClientRect();
    const result = {
      fontFamily: getComputedStyle(probe).fontFamily,
      fontLoaded: document.fonts.check(
        `${String(metrics.weight)} ${String(metrics.sizePx)}px ${metrics.family}`,
        metrics.text,
      ),
      width: rect.width,
      height: rect.height,
    };
    probe.remove();
    return result;
  }, fontMetrics);
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const hasOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
}
