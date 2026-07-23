import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { resolve } from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';
import { createViteConfig } from './vite.config.js';

export default defineConfig(({ mode }) =>
  mergeConfig(
    createViteConfig(mode),
    defineConfig({
      test: {
        projects: [
          {
            test: {
              name: 'unit',
              environment: 'jsdom',
              setupFiles: './src/test/setup.ts',
              css: true,
              restoreMocks: true,
              include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
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
