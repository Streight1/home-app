import { defineConfig } from '@playwright/test';

const reuseLocalStorybook =
  !process.env.CI && process.env.PLAYWRIGHT_REUSE_STORYBOOK === 'true';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI
    ? [
        ['line'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['json', { outputFile: 'test-results/playwright-results.json' }],
      ]
    : 'line',
  use: {
    baseURL: 'http://127.0.0.1:6006',
    browserName: 'chromium',
    colorScheme: 'light',
    locale: 'cs-CZ',
    timezoneId: 'Europe/Prague',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
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
