import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: { disableTelemetry: true },
  viteFinal: (config) => ({
    ...config,
    define: {
      ...config.define,
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
        'storybook-client.apps.googleusercontent.com',
      ),
    },
  }),
};

export default config;
