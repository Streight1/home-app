import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const metadataPath = join(root, 'apps/web/e2e/visual-baseline.json');
const mode = process.argv[2] ?? '--contract';
const isRuntimeMode = ['--runtime', '--runtime-update', '--report'].includes(
  mode,
);
const isBaselineUpdate = mode === '--runtime-update';
const errors = [];

function requireCondition(condition, message) {
  if (!condition) errors.push(message);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function parseOsRelease(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf('=');
        const key = line.slice(0, separator);
        const value = line
          .slice(separator + 1)
          .replace(/^"/, '')
          .replace(/"$/, '');
        return [key, value];
      }),
  );
}

function run(command, args = []) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

const metadata = await readJson(metadataPath);
const rootPackage = await readJson(join(root, 'package.json'));
const webPackage = await readJson(join(root, 'apps/web/package.json'));
const playwrightConfig = await readFile(
  join(root, 'apps/web/playwright.config.ts'),
  'utf8',
);
const visualSource = await readFile(
  join(root, 'apps/web/e2e/visual.spec.ts'),
  'utf8',
);
const helperSource = await readFile(
  join(root, 'apps/web/e2e/storybook-test-helpers.ts'),
  'utf8',
);
const globalStyles = await readFile(
  join(root, 'apps/web/src/styles/globals.css'),
  'utf8',
);
const workflow = await readFile(
  join(root, '.github/workflows/publish-containers.yml'),
  'utf8',
);
const snapshotDirectory = join(root, 'apps/web/e2e/visual.spec.ts-snapshots');
const snapshots = (await readdir(snapshotDirectory)).filter((name) =>
  name.endsWith('.png'),
);
const installedBrowserMetadata = await readJson(
  join(
    root,
    'node_modules/.pnpm',
    `playwright-core@${metadata.playwrightVersion}`,
    'node_modules/playwright-core/browsers.json',
  ),
);
const chromium = installedBrowserMetadata.browsers.find(
  (browser) => browser.name === 'chromium',
);

requireCondition(
  webPackage.devDependencies?.['@playwright/test'] ===
    metadata.playwrightVersion,
  'Metadata baseline neodpovídají verzi @playwright/test.',
);
requireCondition(
  chromium?.revision === metadata.chromiumRevision &&
    chromium?.browserVersion === metadata.chromiumVersion,
  'Playwright browser revision/version neodpovídá metadata baseline.',
);
requireCondition(
  metadata.containerImage.includes(
    `playwright:v${metadata.playwrightVersion}-noble@${metadata.containerDigest}`,
  ),
  'Kanonický image musí připnout Playwright verzi i digest.',
);
requireCondition(
  metadata.os?.family === 'ubuntu' &&
    metadata.os?.version === '24.04' &&
    metadata.os?.codename === 'noble',
  'Baseline musí deklarovat kanonické Ubuntu Noble prostředí.',
);
requireCondition(
  metadata.browserLocale === 'cs-CZ' &&
    metadata.timezone === 'Europe/Prague' &&
    metadata.osLocale === 'C.UTF-8' &&
    metadata.deviceScaleFactor === 1 &&
    metadata.reducedMotion === 'reduce',
  'Baseline metadata musí explicitně připnout locale, timezone, DPR a motion.',
);
requireCondition(
  rootPackage.packageManager === 'pnpm@11.12.0',
  'Visual container očekává repozitářem připnutý pnpm 11.12.0.',
);
requireCondition(
  webPackage.dependencies?.[metadata.font.package] === metadata.font.version,
  'Verze lokálního Inter fontu neodpovídá baseline metadata.',
);
requireCondition(
  Number.isFinite(metadata.font.expectedWidthPx) &&
    Number.isFinite(metadata.font.expectedHeightPx),
  'Baseline metadata musí obsahovat přesnou referenční metriku fontu.',
);
requireCondition(
  globalStyles.includes("@import '@fontsource/inter/") &&
    !/@import\s+url\(|fonts\.(?:googleapis|gstatic)\.com/.test(globalStyles),
  'Visual testy musí používat lokální Inter bez vzdáleného font CDN.',
);
if (!isBaselineUpdate) {
  requireCondition(
    snapshots.length === metadata.snapshotCount &&
      snapshots.every((name) =>
        name.endsWith(`-${metadata.snapshotPlatform}.png`),
      ),
    'Počet nebo platform suffix screenshot baseline neodpovídá metadata.',
  );
} else {
  requireCondition(
    snapshots.every((name) =>
      name.endsWith(`-${metadata.snapshotPlatform}.png`),
    ),
    'Platform suffix existujících screenshot baseline neodpovídá metadata.',
  );
}
requireCondition(
  playwrightConfig.includes(`locale: '${metadata.browserLocale}'`) &&
    playwrightConfig.includes(`timezoneId: '${metadata.timezone}'`) &&
    playwrightConfig.includes(
      `deviceScaleFactor: ${String(metadata.deviceScaleFactor)}`,
    ) &&
    helperSource.includes(`reducedMotion: '${metadata.reducedMotion}'`) &&
    playwrightConfig.includes('maxDiffPixelRatio: 0'),
  'Playwright config musí explicitně používat metadata locale/timezone/DPR/motion bez procentní tolerance.',
);
requireCondition(
  helperSource.includes('document.fonts.ready') &&
    helperSource.includes('requestAnimationFrame'),
  'Screenshot helper musí čekat na fonty a stabilní layout frames.',
);
requireCondition(
  visualSource.includes('assertCanonicalInterFont') &&
    visualSource.includes('fontMetrics'),
  'Visual suite musí ověřit skutečný Inter font a referenční metriku.',
);
requireCondition(
  workflow.includes(metadata.containerImage) &&
    !workflow.includes('playwright install --with-deps chromium'),
  'Browser CI musí používat kanonický image a nesmí do něj znovu instalovat Chromium.',
);
requireCondition(
  !workflow.includes('--update-snapshots'),
  'CI workflow nesmí automaticky aktualizovat visual baseline.',
);

if (isRuntimeMode) {
  requireCondition(
    process.env.HOMEAPP_VISUAL_CANONICAL === 'true',
    'Runtime ověření lze spustit jen v kanonickém visual containeru.',
  );
  requireCondition(
    process.env.HOMEAPP_VISUAL_CONTAINER_IMAGE === metadata.containerImage,
    'Spuštěný visual container neodpovídá metadata image reference.',
  );
  requireCondition(
    process.env.LANG === metadata.osLocale &&
      process.env.LC_ALL === metadata.osLocale &&
      process.env.TZ === metadata.timezone,
    'Runtime locale nebo timezone neodpovídají baseline metadata.',
  );

  const osRelease = parseOsRelease(await readFile('/etc/os-release', 'utf8'));
  requireCondition(
    osRelease.ID === metadata.os.family &&
      osRelease.VERSION_ID?.startsWith(metadata.os.version) &&
      osRelease.VERSION_CODENAME === metadata.os.codename,
    'Runtime OS neodpovídá kanonickému Ubuntu Noble.',
  );

  const browserRoot = process.env.PLAYWRIGHT_BROWSERS_PATH;
  const browserExecutable = browserRoot
    ? join(
        browserRoot,
        `chromium-${metadata.chromiumRevision}`,
        'chrome-linux64/chrome',
      )
    : '';
  let chromiumVersion = '';
  let fontconfigVersion = '';
  try {
    chromiumVersion = run(browserExecutable, ['--version']);
    fontconfigVersion = run('fc-cache', ['--version']);
  } catch (error) {
    errors.push(`Runtime browser/font metadata nelze načíst: ${error.message}`);
  }
  requireCondition(
    chromiumVersion.includes(metadata.chromiumVersion),
    'Runtime Chromium version neodpovídá baseline metadata.',
  );

  if (mode === '--report') {
    const report = {
      os: osRelease.PRETTY_NAME,
      node: process.version,
      pnpm: run('pnpm', ['--version']),
      playwright: webPackage.devDependencies['@playwright/test'],
      chromium: chromiumVersion,
      chromiumRevision: metadata.chromiumRevision,
      fontconfig: fontconfigVersion,
      font: `${metadata.font.package}@${metadata.font.version}`,
      locale: process.env.LANG,
      browserLocale: metadata.browserLocale,
      timezone: process.env.TZ,
      deviceScaleFactor: metadata.deviceScaleFactor,
      containerImage: metadata.containerImage,
    };
    console.log(JSON.stringify(report, null, 2));
  }
}

if (errors.length > 0) {
  console.error(`Visual baseline kontrakt selhal:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else if (mode !== '--report') {
  console.log(
    `Visual baseline kontrakt prošel (${String(metadata.snapshotCount)} PNG, Playwright ${metadata.playwrightVersion}, Chromium ${metadata.chromiumRevision}).`,
  );
}
