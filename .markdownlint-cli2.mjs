export default {
  config: {
    MD013: false,
    MD024: { siblings_only: true },
  },
  globs: [
    '**/*.md',
    '!**/node_modules/**',
    '!database/**',
    '!uploads/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/playwright-report/**',
    '!**/test-results/**',
    '!apps/api/src/generated/**',
  ],
};
