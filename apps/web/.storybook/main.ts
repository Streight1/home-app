import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import { createSharedViteConfig } from '../vite.shared.config.js';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: { disableTelemetry: true },
  viteFinal: (viteConfig) =>
    Promise.resolve(
      mergeConfig(
        viteConfig,
        createSharedViteConfig({ includePlugins: false }),
      ),
    ),
};

export default config;
