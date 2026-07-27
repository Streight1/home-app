import { readFile, appendFile } from 'node:fs/promises';
import process from 'node:process';

const [title = 'CI job', ...reportPaths] = process.argv.slice(2);
const destination = process.env.GITHUB_STEP_SUMMARY;
if (!destination) process.exit(0);

let total = 0;
let failed = 0;
for (const path of reportPaths) {
  try {
    const source = await readFile(path, 'utf8');
    if (path.endsWith('.xml')) {
      const rootSuite = source.match(/<testsuites\b([^>]*)>/);
      const attributes = rootSuite?.[1] ?? '';
      total += Number(attributes.match(/\btests="(\d+)"/)?.[1] ?? 0);
      failed += Number(attributes.match(/\bfailures="(\d+)"/)?.[1] ?? 0);
      failed += Number(attributes.match(/\berrors="(\d+)"/)?.[1] ?? 0);
    } else if (path.endsWith('.json')) {
      const report = JSON.parse(source);
      const visit = (suite) => {
        for (const spec of suite.specs ?? []) {
          for (const test of spec.tests ?? []) {
            total += 1;
            if (test.status !== 'expected' && test.status !== 'skipped')
              failed += 1;
          }
        }
        for (const child of suite.suites ?? []) visit(child);
      };
      for (const suite of report.suites ?? []) visit(suite);
    }
  } catch {
    // A failed command may stop before creating its report; the job log remains canonical.
  }
}

const status = process.env.CI_JOB_STATUS ?? 'unknown';
const testSummary = total
  ? `${total - failed}/${total}`
  : 'bez testovacího reportu';
const startedAt = Number(process.env.HOMEAPP_CI_STARTED_AT);
const durationSeconds = Number.isFinite(startedAt)
  ? Math.max(0, Math.round(Date.now() / 1_000 - startedAt))
  : null;
const duration =
  durationSeconds === null ? 'nedostupná' : `${durationSeconds} s`;
const artifactLink =
  status === 'failure' &&
  process.env.GITHUB_SERVER_URL &&
  process.env.GITHUB_REPOSITORY &&
  process.env.GITHUB_RUN_ID
    ? `- Diagnostické artefakty: ${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}#artifacts\n`
    : '';
await appendFile(
  destination,
  `## ${title}\n\n- Výsledek: **${status}**\n- Testy: **${testSummary}**\n- Doba jobu: **${duration}**\n- Revize: \`${process.env.GITHUB_SHA ?? 'local'}\`\n${artifactLink}\n`,
);
