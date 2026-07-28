import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite';

interface SharedViteConfigOptions {
  includePlugins?: boolean;
}

export function createSharedViteConfig(
  options: SharedViteConfigOptions = {},
): UserConfig {
  return {
    // Build, Storybook and tests must not inherit the application's root .env.
    envDir: false,
    ...(options.includePlugins === false
      ? {}
      : { plugins: [react(), tailwindcss()] }),
    preview: { port: 4173, strictPort: true },
  };
}
