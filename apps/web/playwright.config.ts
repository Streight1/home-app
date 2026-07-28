import { defineConfig } from '@playwright/test';

const reuseLocalStorybook =
  !process.env.CI && process.env.PLAYWRIGHT_REUSE_STORYBOOK === 'true';
const suite = process.env.HOMEAPP_PLAYWRIGHT_SUITE ?? 'browser';

export default defineConfig({
  testDir: './e2e',
  outputDir: `test-results/${suite}`,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ['line'],
        ['html', { outputFolder: `playwright-report/${suite}`, open: 'never' }],
        [
          'json',
          { outputFile: `test-results/${suite}/playwright-results.json` },
        ],
      ]
    : 'line',
  use: {
    baseURL: 'http://127.0.0.1:6006',
    browserName: 'chromium',
    colorScheme: 'light',
    locale: 'cs-CZ',
    timezoneId: 'Europe/Prague',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      threshold: 0.15,
      maxDiffPixelRatio: 0,
    },
  },
  webServer: {
    command: 'pnpm storybook',
    url: 'http://127.0.0.1:6006/index.json',
    reuseExistingServer: reuseLocalStorybook,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
