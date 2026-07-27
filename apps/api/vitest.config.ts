import { defineConfig } from 'vitest/config';

const junitReportFile = process.env.VITEST_REPORT_FILE;

export default defineConfig({
  test: {
    coverage: { reporter: ['text', 'html'] },
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    reporters: junitReportFile ? ['default', 'junit'] : ['default'],
    ...(junitReportFile ? { outputFile: { junit: junitReportFile } } : {}),
    restoreMocks: true,
  },
});
