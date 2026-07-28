import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { resolve } from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import { createSharedViteConfig } from './vite.shared.config.js';

const reportFile = process.env.VITEST_REPORT_FILE;

export default defineConfig(() =>
  mergeConfig(
    createSharedViteConfig(),
    defineConfig({
      test: {
        reporters: reportFile ? ['default', 'junit'] : ['default'],
        ...(reportFile ? { outputFile: { junit: reportFile } } : {}),
        projects: [
          {
            test: {
              name: 'unit',
              environment: 'jsdom',
              setupFiles: './src/test/setup.ts',
              css: true,
              restoreMocks: true,
              include: [
                'src/**/*.spec.ts',
                'src/**/*.spec.tsx',
                'vite-config.spec.ts',
              ],
            },
          },
          {
            extends: true,
            plugins: [
              storybookTest({
                configDir: resolve(import.meta.dirname, '.storybook'),
                tags: { include: ['test'] },
              }),
            ],
            test: {
              name: 'storybook',
              browser: {
                enabled: true,
                provider: playwright({}),
                headless: true,
                instances: [{ browser: 'chromium' }],
              },
            },
          },
        ],
      },
    }),
  ),
);
