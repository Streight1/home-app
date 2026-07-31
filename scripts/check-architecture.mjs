import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];

async function collectFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (
      [
        '.storybook',
        'dist',
        'e2e',
        'generated',
        'node_modules',
        'stories',
        'test',
        '__tests__',
      ].includes(entry.name)
    )
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...(await collectFiles(path, extension)));
    if (
      entry.isFile() &&
      path.endsWith(extension) &&
      !/\.(spec|stories|test)\.[^.]+$/.test(path)
    )
      files.push(path);
  }
  return files;
}

async function readLines(path) {
  return (await readFile(path, 'utf8')).split(/\r?\n/);
}

async function directoryExists(path) {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
}

const webSource = join(root, 'apps/web/src');
const tsxFiles = await collectFiles(webSource, '.tsx');
const webTsFiles = await collectFiles(webSource, '.ts');
for (const file of tsxFiles) {
  const count = (await readLines(file)).length;
  if (count > 300)
    errors.push(`${relative(root, file)} má ${count} řádků; limit je 300.`);
}

const appPath = join(webSource, 'app/App.tsx');
const appLines = await readLines(appPath);
const appSource = appLines.join('\n');
if (appLines.length > 80)
  errors.push(
    `apps/web/src/app/App.tsx má ${appLines.length} řádků; limit je 80.`,
  );
for (const forbidden of [
  /<Route\b/,
  /features\//,
  /layouts\//,
  /<main\b/,
  /\bfetch\s*\(/,
]) {
  if (forbidden.test(appSource))
    errors.push(
      `apps/web/src/app/App.tsx obsahuje zakázaný vzor ${forbidden}.`,
    );
}

const mainPath = join(webSource, 'main.tsx');
const mainSource = await readFile(mainPath, 'utf8');
const mainLines = mainSource.split(/\r?\n/).length;
if (mainLines > 30)
  errors.push(`apps/web/src/main.tsx má ${mainLines} řádků; limit je 30.`);
for (const forbidden of [
  /<Route\b/,
  /createBrowserRouter/,
  /use(Query|Mutation)/,
  /\bfetch\s*\(/,
  /features\//,
  /className=/,
]) {
  if (forbidden.test(mainSource))
    errors.push(`apps/web/src/main.tsx obsahuje zakázaný vzor ${forbidden}.`);
}

const shellDirectory = join(webSource, 'layouts/AppShell');
const requiredShellFiles = [
  'AppShell.tsx',
  'DesktopSidebar.tsx',
  'CollapsedSidebar.tsx',
  'TabletNavigationRail.tsx',
  'MobileHeader.tsx',
  'MobileBottomNavigation.tsx',
  'AppTopBar.tsx',
  'HouseholdSwitcher.tsx',
  'UserMenu.tsx',
  'QuickCreateButton.tsx',
  'HomeBrandButton.tsx',
  'EnvironmentBadge.tsx',
  'navigation.config.ts',
  'app-shell.types.ts',
  'sidebarPreference.ts',
];
for (const file of requiredShellFiles) {
  try {
    await readFile(join(shellDirectory, file), 'utf8');
  } catch {
    errors.push(`App shell postrádá povinný soubor ${file}.`);
  }
}

const navigationConfigSource = await readFile(
  join(shellDirectory, 'navigation.config.ts'),
  'utf8',
);
const primaryNavigationSource = navigationConfigSource.slice(
  navigationConfigSource.indexOf('export const desktopNavigation'),
  navigationConfigSource.indexOf('export function workspaceViewForArea'),
);
if (/area:\s*['"]maintenance['"]/.test(primaryNavigationSource))
  errors.push(
    'Údržba nesmí být samostatná položka hlavní navigace; patří pod Úkoly.',
  );
if (
  !/getPrimaryNavigationArea[\s\S]*view\.area\s*===\s*['"]maintenance['"][\s\S]*['"]tasks['"]/.test(
    navigationConfigSource,
  )
)
  errors.push(
    'Hlavní navigace musí centralizovaně mapovat maintenance view na Úkoly.',
  );
for (const navigationComponent of [
  'DesktopSidebar.tsx',
  'CollapsedSidebar.tsx',
  'TabletNavigationRail.tsx',
  'MobileBottomNavigation.tsx',
]) {
  const source = await readFile(
    join(shellDirectory, navigationComponent),
    'utf8',
  );
  if (!source.includes('getPrimaryNavigationArea'))
    errors.push(
      `${navigationComponent} obchází centrální mapování aktivní hlavní oblasti.`,
    );
}

const shellPath = join(shellDirectory, 'AppShell.tsx');
const shellLines = await readLines(shellPath);
const shellSource = shellLines.join('\n');
if (shellLines.length > 150)
  errors.push(
    `apps/web/src/layouts/AppShell/AppShell.tsx má ${shellLines.length} řádků; limit je 150.`,
  );
for (const forbidden of [
  /useCurrentUser/,
  /useLogout/,
  /\bfetch\s*\(/,
  /Dashboard(?:Page|Overview)/,
]) {
  if (forbidden.test(shellSource))
    errors.push(`AppShell.tsx obsahuje business vzor ${forbidden}.`);
}

const hardcodedColor = /(?:#[0-9a-f]{3,8}\b|(?:rgb|hsl)a?\s*\()/i;
for (const file of tsxFiles) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (hardcodedColor.test(source))
    errors.push(`${path} obsahuje hardcoded barvu mimo design tokeny.`);
  if (/\/design-preview|\/preview-design/.test(source))
    errors.push(`${path} vytváří zakázanou produkční design preview route.`);
  if (/\bfetch\s*\(/.test(source))
    errors.push(`${path} volá fetch přímo z React komponenty.`);
}
for (const file of [...tsxFiles, ...webTsFiles]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/stories\/fixtures|\.fixture(?:\.js)?['"]/.test(source))
    errors.push(`${path} importuje Storybook fixture do produkčního kódu.`);
}

const themeDirectory = join(webSource, 'features/theme');
for (const required of [
  'components/ThemeSelector.tsx',
  'hooks/useTheme.ts',
  'lib/applyTheme.ts',
  'lib/themeStorage.ts',
  'providers/ThemeProvider.tsx',
  'types/theme.types.ts',
]) {
  try {
    await readFile(join(themeDirectory, required), 'utf8');
  } catch {
    errors.push(`Theme infrastruktura postrádá povinný soubor ${required}.`);
  }
}

const timeGridDirectory = join(
  webSource,
  'features/calendar/components/time-grid',
);
const eventBlockSource = await readFile(
  join(timeGridDirectory, 'CalendarEventBlock.tsx'),
  'utf8',
);
const eventItemSource = await readFile(
  join(
    webSource,
    'features/calendar/components/calendar/CalendarEventItem.tsx',
  ),
  'utf8',
);
if (
  /\b(?:bg-(?:surface|primary|violet|blue|cyan|green|amber|orange|rose|pink)|backgroundColor)\b/.test(
    eventItemSource,
  )
)
  errors.push(
    'CalendarEventItem nesmí přepisovat centralizovaný event visual model hardcoded pozadím.',
  );
if (!eventItemSource.includes('calendarVisualClasses[visual.colorToken]'))
  errors.push(
    'CalendarEventItem musí aplikovat celý sémantický visual model události.',
  );
if (
  !eventBlockSource.includes('getSegmentHeightPx') ||
  /MINUTE_HEIGHT_PX|HOUR_HEIGHT_PX|endMinute\s*-\s*segment\.startMinute/.test(
    eventBlockSource,
  )
)
  errors.push(
    'CalendarEventBlock musí používat výhradně centralizovanou time-grid geometrii.',
  );
if (!/compact\s*\?\s*['"][^'"]*h-full/.test(eventItemSource))
  errors.push(
    'Kompaktní CalendarEventItem musí vyplnit celou výšku positioning wrapperu.',
  );
for (const file of await collectFiles(timeGridDirectory, '.tsx')) {
  if (file.endsWith('CalendarEventBlock.tsx')) continue;
  const source = await readFile(file, 'utf8');
  if (/getSegmentHeightPx|MIN_EVENT_HEIGHT_PX/.test(source))
    errors.push(
      `${relative(root, file)} zavádí paralelní výpočet výšky event segmentu.`,
    );
}

for (const file of tsxFiles.filter((path) => /\/pages\//.test(path))) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (!path.includes('/features/theme/')) {
    for (const forbidden of [
      /\buseTheme\b/,
      /\bThemeProvider\b/,
      /\blocalStorage\b/,
      /\bmatchMedia\b/,
      /data-theme/,
    ]) {
      if (forbidden.test(source))
        errors.push(`${path} implementuje theme logiku přímo (${forbidden}).`);
    }
  }
}

for (const forbidden of [
  /\bThemeProvider\b/,
  /\buseTheme\b/,
  /\blocalStorage\b/,
  /\bmatchMedia\b/,
  /data-theme/,
]) {
  if (forbidden.test(appSource))
    errors.push(`App.tsx obsahuje theme implementaci ${forbidden}.`);
}

let themeProviderDefinitions = 0;
for (const file of tsxFiles) {
  const source = await readFile(file, 'utf8');
  themeProviderDefinitions += (
    source.match(/export\s+function\s+\w*ThemeProvider\b/g) ?? []
  ).length;
}
if (themeProviderDefinitions !== 1)
  errors.push(
    `Produkční kód musí mít právě jeden theme provider; nalezeno ${themeProviderDefinitions}.`,
  );

const themeStoragePath = join(themeDirectory, 'lib/themeStorage.ts');
const calendarPreferenceCachePath = join(
  webSource,
  'features/location/lib/calendarPreferencesCache.ts',
);
const sidebarPreferencePath = join(
  webSource,
  'layouts/AppShell/sidebarPreference.ts',
);
const recentSearchStoragePath = join(
  webSource,
  'features/global-search/storage/recentSearchItems.ts',
);
const themeStorageSource = await readFile(themeStoragePath, 'utf8');
if (!themeStorageSource.includes("THEME_STORAGE_KEY = 'homeapp.theme'"))
  errors.push('Theme preference nepoužívá stabilní klíč homeapp.theme.');
for (const file of [...tsxFiles, ...webTsFiles]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (
    /\blocalStorage\b/.test(source) &&
    ![
      themeStoragePath,
      calendarPreferenceCachePath,
      sidebarPreferencePath,
      recentSearchStoragePath,
    ].includes(file)
  )
    errors.push(`${path} přistupuje k localStorage mimo themeStorage.ts.`);
}
const sidebarPreferenceSource = await readFile(sidebarPreferencePath, 'utf8');
if (
  !sidebarPreferenceSource.includes(
    "SIDEBAR_PREFERENCE_KEY = 'homeapp.navigation.sidebar.v1'",
  )
)
  errors.push(
    'Sbalení sidebaru nepoužívá jediný verzovaný klíč homeapp.navigation.sidebar.v1.',
  );
const calendarPreferenceCacheSource = await readFile(
  calendarPreferenceCachePath,
  'utf8',
);
if (
  !/CALENDAR_PREFERENCES_CACHE_KEY\s*=\s*['"]homeapp\.calendar\.preferences\.cache['"]/.test(
    calendarPreferenceCacheSource,
  )
)
  errors.push(
    'Calendar view cache nepoužívá stabilní namespacovaný klíč homeapp.calendar.preferences.cache.',
  );
if (
  /defaultPlace|routeMode|avoidToll|avoidHighways|bufferMinutes/.test(
    calendarPreferenceCacheSource,
  )
)
  errors.push(
    'Lokální calendar cache smí obsahovat pouze volby zobrazení, ne cestovní preference.',
  );

const unsupportedIconLibrary =
  /from\s+['"](?:@heroicons|react-icons|@fortawesome|phosphor-react|heroicons)/;
for (const file of [...tsxFiles, ...webTsFiles]) {
  const source = await readFile(file, 'utf8');
  if (unsupportedIconLibrary.test(source))
    errors.push(
      `${relative(root, file)} používá paralelní ikonovou knihovnu; povolen je lucide-react.`,
    );
}

const indexSource = await readFile(join(root, 'apps/web/index.html'), 'utf8');
const preHydrationThemeSource = await readFile(
  join(root, 'apps/web/public/theme-init.js'),
  'utf8',
);
for (const required of [
  'homeapp.theme',
  'prefers-color-scheme: dark',
  'data-theme',
  'theme-color',
  'color-scheme',
]) {
  if (!`${indexSource}\n${preHydrationThemeSource}`.includes(required))
    errors.push(
      `Pre-hydration theme bootstrap postrádá povinný prvek ${required}.`,
    );
}
if (!indexSource.includes('src="/theme-init.js"'))
  errors.push('index.html musí načíst lokální theme bootstrap před aplikací.');

const dashboardPagePath = join(
  webSource,
  'features/dashboard/pages/DashboardPage.tsx',
);
const dashboardPage = await readFile(dashboardPagePath, 'utf8');
if (/Mobile(?:Bottom)?Navigation|mobileNavigation/.test(dashboardPage))
  errors.push('DashboardPage.tsx nesmí přímo implementovat mobilní navigaci.');

const routerSource = await readFile(join(webSource, 'app/router.tsx'), 'utf8');
const browserRoutePaths = [
  ...routerSource.matchAll(/<Route\s+path=["']([^"']+)["']/g),
].map((match) => match[1]);
for (const routePath of browserRoutePaths) {
  if (!['/', '/login', '/app', '*'].includes(routePath))
    errors.push(
      `Browser router obsahuje nepovolenou feature URL ${routePath}; aplikační navigace patří pod /app.`,
    );
}

const workspaceStoragePath = join(
  webSource,
  'app/workspace-navigation/workspace-storage.ts',
);
const workspaceDirectory = join(webSource, 'app/workspace-navigation');
for (const file of [...tsxFiles, ...webTsFiles]) {
  const source = await readFile(file, 'utf8');
  if (/\bsessionStorage\b/.test(source) && file !== workspaceStoragePath)
    errors.push(
      `${relative(root, file)} přistupuje k sessionStorage mimo validovanou workspace storage vrstvu.`,
    );
  if (
    /window\.history|history\.(?:pushState|replaceState|back\s*\()/.test(
      source,
    ) &&
    !file.startsWith(workspaceDirectory)
  )
    errors.push(
      `${relative(root, file)} přistupuje k History API mimo workspace navigation vrstvu.`,
    );
}

const workspaceStateSource = (
  await Promise.all(
    [...tsxFiles, ...webTsFiles]
      .filter((file) => file.startsWith(workspaceDirectory))
      .map((file) => readFile(file, 'utf8')),
  )
).join('\n');
for (const sensitive of [
  /sessionToken/i,
  /csrfToken/i,
  /googleCredential/i,
  /metadataJson/i,
  /documentTitle/i,
  /description\s*:/i,
  /locationLabel/i,
  /locationNotes/i,
  /latitude|longitude/i,
]) {
  if (sensitive.test(workspaceStateSource))
    errors.push(
      `Workspace navigation state obsahuje zakázané citlivé pole ${sensitive}.`,
    );
}

const apiSource = join(root, 'apps/api/src');
const apiMainSource = await readFile(join(apiSource, 'main.ts'), 'utf8');
const corsOptionsSource = await readFile(
  join(apiSource, 'common/http/cors-options.ts'),
  'utf8',
);
if (!apiMainSource.includes('createCorsOptions(config.webOrigin)'))
  errors.push('Nest bootstrap nepoužívá centralizovanou CORS konfiguraci.');
for (const method of ["'PUT'", "'DELETE'"]) {
  if (!corsOptionsSource.includes(method))
    errors.push(`CORS konfigurace nepovoluje mutační metodu ${method}.`);
}
const apiFiles = await collectFiles(apiSource, '.ts');
const publicEndpointOwner = 'apps/api/src/modules/auth/auth.controller.ts';
for (const file of apiFiles) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/invitation.*\.controller\.ts$/i.test(path))
    errors.push(`${path} zavádí zakázaný invitation controller.`);
  if (source.includes('@PublicEndpoint(') && path !== publicEndpointOwner) {
    errors.push(`@PublicEndpoint() je nepovoleně použit v ${path}.`);
  }
  for (const forbidden of [
    'ServeStaticModule',
    'useStaticAssets',
    'express.static',
    "'/uploads",
    '"/uploads',
  ]) {
    if (source.includes(forbidden))
      errors.push(
        `${path} obsahuje zakázané statické publikování: ${forbidden}.`,
      );
  }
}

const locationDirectory = join(apiSource, 'modules/location');
const locationControllers = join(locationDirectory, 'presentation');
for (const file of await collectFiles(locationControllers, '.ts')) {
  if (!file.endsWith('.controller.ts')) continue;
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/Prisma(?:Service|Client)|@PublicEndpoint\(/.test(source))
    errors.push(
      `${path} porušuje chráněnou aplikační hranici Location modulu.`,
    );
}

const providerDirectory = join(locationDirectory, 'infrastructure/providers');
for (const file of apiFiles) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (
    /api\.mapy\.(?:com|cz)\/v1/.test(source) &&
    !file.startsWith(providerDirectory)
  )
    errors.push(`${path} volá Mapy API mimo provider adapter.`);
  if (
    path.startsWith('apps/api/src/modules/calendar/') &&
    /MapyApiClient|MapyGeocodingAdapter|MapyRoutingAdapter/.test(source)
  )
    errors.push(`${path} závisí přímo na Mapy adapteru místo location portu.`);
}

const locationWebDirectory = join(webSource, 'features/location');
for (const file of [...tsxFiles, ...webTsFiles]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/VITE_MAPY_API_KEY|import\.meta\.env\.MAPY_API_KEY/.test(source))
    errors.push(`${path} vystavuje serverový Mapy API klíč prohlížeči.`);
  if (/api\.mapy\.(?:com|cz)\/v1/.test(source))
    errors.push(`${path} volá Mapy REST API přímo z prohlížeče.`);
  if (
    path.startsWith('apps/web/src/features/calendar/') &&
    path.endsWith('.tsx') &&
    /departureAt\s*=|startsAt[^\n]*(?:duration|buffer)|duration[^\n]*buffer/.test(
      source,
    )
  )
    errors.push(`${path} počítá čas odjezdu v React komponentě.`);
}
for (const required of [
  'components/MapyAttribution.tsx',
  'components/PlaceAutocomplete.tsx',
  'components/RouteEstimateSummary.tsx',
]) {
  try {
    await readFile(join(locationWebDirectory, required), 'utf8');
  } catch {
    errors.push(`Location feature postrádá povinnou UI část ${required}.`);
  }
}
for (const consumer of [
  'components/PlaceSuggestionList.tsx',
  'components/RouteEstimateSummary.tsx',
]) {
  const source = await readFile(join(locationWebDirectory, consumer), 'utf8');
  if (!source.includes('MapyAttribution'))
    errors.push(`${consumer} nezobrazuje povinnou atribuci Mapy.com.`);
}

const defaultPlaceSource = await readFile(
  join(locationWebDirectory, 'components/DefaultPlaceAutocomplete.tsx'),
  'utf8',
);
if (
  !defaultPlaceSource.includes('PlaceAutocomplete') ||
  /<select\b|<Select\b/.test(defaultPlaceSource)
)
  errors.push(
    'Výchozí místo musí používat autocomplete a nesmí být pouze výběr z uložených míst.',
  );

const calendarLocationWebDirectory = join(webSource, 'features/calendar');
for (const file of await collectFiles(calendarLocationWebDirectory, '.tsx')) {
  const source = await readFile(file, 'utf8');
  if (/email[^\n]*(?:color|colour)|(?:color|colour)[^\n]*email/i.test(source))
    errors.push(`${relative(root, file)} odvozuje barvu účastníka z e-mailu.`);
}
const calendarDateSource = await readFile(
  join(calendarLocationWebDirectory, 'lib/calendarDate.ts'),
  'utf8',
);
if (!calendarDateSource.includes('item.start <= dateKey && dateKey < item.end'))
  errors.push(
    'Celodenní date-only rozsah musí používat start <= den < endExclusive bez implicitního UTC Date převodu.',
  );
const calendarFormSource = await readFile(
  join(calendarLocationWebDirectory, 'components/forms/CalendarEventForm.tsx'),
  'utf8',
);
const scheduleFieldsSource = await readFile(
  join(
    calendarLocationWebDirectory,
    'components/forms/EventScheduleFields.tsx',
  ),
  'utf8',
);
if (
  /addDays\s*\(/.test(calendarFormSource) ||
  /addDays\s*\(/.test(scheduleFieldsSource) ||
  !calendarFormSource.includes('inclusiveAllDayEndToExclusive') ||
  !scheduleFieldsSource.includes('exclusiveAllDayEndToInclusive')
)
  errors.push(
    'Inclusive/exclusive all-day převod smí probíhat pouze přes centralizovaný date-only adapter.',
  );
const dashboardCalendarWidgetSource = await readFile(
  join(
    calendarLocationWebDirectory,
    'components/dashboard/TodayCalendarWidget.tsx',
  ),
  'utf8',
);
if (
  !dashboardCalendarWidgetSource.includes('useCreateCalendarEventDialog') ||
  /CalendarEventForm|createCalendarEvent\s*\(/.test(
    dashboardCalendarWidgetSource,
  )
)
  errors.push(
    'Homepage kalendář musí otevírat centrální create dialog a nesmí kopírovat formulář ani mutation logiku.',
  );
const desktopSidebarSource = await readFile(
  join(shellDirectory, 'DesktopSidebar.tsx'),
  'utf8',
);
if (
  !desktopSidebarSource.includes('HomeBrandButton') ||
  !desktopSidebarSource.includes('Sbalit hlavní menu')
)
  errors.push(
    'Desktop brand a ovladač sbalení musí být oddělené přístupné click targety.',
  );

const calendarTemplateSources = (
  await Promise.all(
    [...tsxFiles, ...webTsFiles, ...apiFiles]
      .filter(
        (file) =>
          /calendar.*template|templates\//i.test(file) &&
          !file.endsWith('prisma-calendar-template.repository.ts'),
      )
      .map((file) => readFile(file, 'utf8')),
  )
).join('\n');
if (/originPlaceId|previousEventId/.test(calendarTemplateSources))
  errors.push(
    'Kalendářní šablona nesmí ukládat konkrétní originPlaceId ani previousEventId.',
  );

const shiftPresetSource = await readFile(
  join(calendarLocationWebDirectory, 'components/forms/workShiftPresets.ts'),
  'utf8',
);
for (const requiredPreset of [
  "label: 'Denní 08:00–20:00'",
  "label: 'Noční 20:00–08:00'",
  "label: 'Ranní 08:00–14:00'",
  "label: 'Odpolední 14:00–20:00'",
  'endDayOffset: 1',
]) {
  if (!shiftPresetSource.includes(requiredPreset))
    errors.push(`Registr pracovních směn postrádá ${requiredPreset}.`);
}

const prismaSchemaSource = await readFile(
  join(root, 'apps/api/prisma/schema.prisma'),
  'utf8',
);
const savedPlaceModel =
  prismaSchemaSource.match(/model SavedPlace \{[\s\S]*?\n\}/)?.[0] ?? '';
for (const forbiddenField of [
  /\bproviderPlaceId\b/,
  /\blatitude\b/,
  /\blongitude\b/,
  /\braw(?:Response|Provider)/,
]) {
  if (forbiddenField.test(savedPlaceModel))
    errors.push(
      `SavedPlace persistuje zakázaný Mapy provider výsledek ${forbiddenField}.`,
    );
}
const travelPlanModel =
  prismaSchemaSource.match(
    /model CalendarEventTravelPlan \{[\s\S]*?\n\}/,
  )?.[0] ?? '';
for (const forbiddenField of [
  /\bdistanceMeters\b/,
  /\bdurationSeconds\b/,
  /\bproviderCalculatedAt\b/,
  /\binputHash\b/,
  /\brouteGeometry\b/,
]) {
  if (forbiddenField.test(travelPlanModel))
    errors.push(
      `CalendarEventTravelPlan persistuje zakázaný route výsledek ${forbiddenField}.`,
    );
}

const providerResultServices = await Promise.all(
  [
    join(locationDirectory, 'application/places/suggest-places.service.ts'),
    join(
      locationDirectory,
      'application/routing/calculate-route-estimate.service.ts',
    ),
  ].map((file) => readFile(file, 'utf8')),
);
if (
  providerResultServices.some((source) =>
    /new Map\s*\(|cacheTtl|inputHash/i.test(source),
  )
)
  errors.push(
    'Mapy Suggest ani Routing výsledky se nesmějí aplikačně cachovat.',
  );
if (
  /MAPY_(?:SUGGEST|ROUTE)_CACHE_TTL|mapy(?:Suggest|Route)CacheTtl/.test(
    `${await readFile(join(root, '.env.example'), 'utf8')}\n${(
      await Promise.all(apiFiles.map((file) => readFile(file, 'utf8')))
    ).join('\n')}`,
  )
)
  errors.push('Workspace stále obsahuje zastaralé Mapy cache TTL nastavení.');

const documentsControllerDirectory = join(
  apiSource,
  'modules/documents/presentation',
);
for (const file of await collectFiles(documentsControllerDirectory, '.ts')) {
  if (!file.endsWith('.controller.ts')) continue;
  const source = await readFile(file, 'utf8');
  if (
    /Prisma(?:Service|Client)|\.document\.(?:find|create|update|delete)/.test(
      source,
    )
  )
    errors.push(
      `${relative(root, file)} přistupuje přímo k Prisma místo aplikační služby.`,
    );
  if (source.includes('@PublicEndpoint('))
    errors.push(`${relative(root, file)} nesmí zveřejnit documents endpoint.`);
}

const extractionControllerDirectory = join(
  apiSource,
  'modules/document-extraction/presentation',
);
for (const file of await collectFiles(extractionControllerDirectory, '.ts')) {
  if (!file.endsWith('.controller.ts')) continue;
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/Prisma(?:Service|Client)|@PublicEndpoint\(/.test(source))
    errors.push(
      `${path} porušuje chráněnou aplikační hranici extrakčního modulu.`,
    );
}

const tasksDirectory = join(apiSource, 'modules/tasks');
const tasksControllerDirectory = join(tasksDirectory, 'presentation');
for (const file of await collectFiles(tasksControllerDirectory, '.ts')) {
  if (!file.endsWith('.controller.ts')) continue;
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/Prisma(?:Service|Client)|@PublicEndpoint\(/.test(source))
    errors.push(`${path} porušuje chráněnou aplikační hranici Tasks modulu.`);
  if (
    /CalculateNextOccurrence|zonedDayBounds|setDate\(|setMonth\(|daysInMonth/.test(
      source,
    )
  )
    errors.push(`${path} obsahuje recurrence výpočet místo doménové služby.`);
}

const calendarDirectory = join(apiSource, 'modules/calendar');
const calendarControllerDirectory = join(calendarDirectory, 'presentation');
for (const file of await collectFiles(calendarControllerDirectory, '.ts')) {
  if (!file.endsWith('.controller.ts')) continue;
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/Prisma(?:Service|Client)|@PublicEndpoint\(/.test(source))
    errors.push(
      `${path} porušuje chráněnou aplikační hranici Calendar modulu.`,
    );
}

for (const file of await collectFiles(calendarDirectory, '.ts')) {
  const path = relative(root, file);
  const lineCount = (await readLines(file)).length;
  if (path.includes('/application/') && lineCount > 300)
    errors.push(
      `${path} je nepřiměřeně velký Calendar use case; limit je 240 řádků.`,
    );
  if (/calendar-service\.ts$/i.test(path))
    errors.push(`${path} zavádí zakázaný univerzální CalendarService.`);
}

for (const file of await collectFiles(tasksDirectory, '.ts')) {
  const source = await readFile(file, 'utf8');
  if (/\bCalendarEvent\b|calendarEvent\.(?:create|update|upsert)/.test(source))
    errors.push(
      `${relative(root, file)} kopíruje kalendářní události do Tasks modulu.`,
    );
  if (
    /modules\/maintenance\/(?:application|domain|infrastructure|presentation)\//.test(
      source,
    )
  )
    errors.push(
      `${relative(root, file)} importuje interní Maintenance vrstvu místo veřejného rozhraní.`,
    );
}

const tasksWebDirectory = join(webSource, 'features/tasks');
for (const file of [
  ...(await collectFiles(tasksWebDirectory, '.ts')),
  ...(await collectFiles(tasksWebDirectory, '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  if (
    /(?:features\/maintenance|\.\.\/maintenance)\/(?!maintenance\.public)/.test(
      source,
    )
  )
    errors.push(
      `${relative(root, file)} importuje interní Maintenance feature místo veřejného rozhraní.`,
    );
}
for (const workspaceViewPath of [
  join(tasksWebDirectory, 'navigation/TasksWorkspaceView.tsx'),
  join(
    webSource,
    'features/maintenance/navigation/MaintenanceWorkspaceView.tsx',
  ),
]) {
  const source = await readFile(workspaceViewPath, 'utf8');
  if (!source.includes('TasksAreaNavigation'))
    errors.push(
      `${relative(root, workspaceViewPath)} postrádá společnou sekundární navigaci Úkoly/Údržba.`,
    );
}

if (await directoryExists(join(apiSource, 'modules/agenda')))
  errors.push('Backend nesmí obsahovat paralelní modules/agenda vedle Tasks.');
if (await directoryExists(join(webSource, 'features/agenda')))
  errors.push(
    'Frontend nesmí obsahovat paralelní features/agenda vedle Tasks.',
  );
for (const file of apiFiles) {
  const source = await readFile(file, 'utf8');
  if (/Controller\(['"]agenda|\/api\/v1\/agenda/.test(source))
    errors.push(`${relative(root, file)} stále zavádí zastaralé Agenda API.`);
}

for (const file of await collectFiles(tasksDirectory, '.ts')) {
  const path = relative(root, file);
  const lineCount = (await readLines(file)).length;
  if (path.includes('/application/') && lineCount > 240)
    errors.push(
      `${path} je nepřiměřeně velký Tasks use case; limit je 240 řádků.`,
    );
  if (/tasks-service\.ts$/i.test(path))
    errors.push(`${path} zavádí zakázaný univerzální TasksService.`);
}

const tasksPagePath = join(webSource, 'features/tasks/pages/TasksPage.tsx');
try {
  const tasksPageLines = await readLines(tasksPagePath);
  if (tasksPageLines.length > 200)
    errors.push(
      `TasksPage.tsx má ${tasksPageLines.length} řádků; limit je 200.`,
    );
} catch {
  errors.push('Chybí samostatná TasksPage.tsx.');
}

for (const file of [
  ...(await collectFiles(tasksWebDirectory, '.ts')),
  ...(await collectFiles(tasksWebDirectory, '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/\bfetch\s*\(/.test(source) && path.includes('/components/'))
    errors.push(`${path} volá fetch přímo z Tasks komponenty.`);
  if (
    /CalculateNextOccurrence|zonedDayBounds|setDate\(|setMonth\(|daysInMonth/.test(
      source,
    ) &&
    path.includes('/components/') &&
    !path.endsWith('/TaskDueDatePicker.tsx')
  )
    errors.push(`${path} implementuje recurrence výpočet v React komponentě.`);
  if (
    /(?:features\/documents|\.\.\/documents)\/(?!documents\.public)/.test(
      source,
    )
  )
    errors.push(
      `${path} importuje interní část Documents feature místo public API.`,
    );
}

const tasksApiSource = await readFile(
  join(tasksWebDirectory, 'api/tasksApi.ts'),
  'utf8',
);
const taskDashboardHookSource = await readFile(
  join(tasksWebDirectory, 'hooks/useTasksDashboard.ts'),
  'utf8',
);
if (/\/agenda(?:\/|\?|['"`])/.test(tasksApiSource))
  errors.push('Tasks dashboard nesmí používat zastaralý /agenda endpoint.');
if (
  !tasksApiSource.includes('/tasks/dashboard?timezone=') ||
  /tasks\/dashboard[^\n]*(?:page|pageSize|view)=/.test(tasksApiSource)
)
  errors.push(
    'Tasks dashboard musí používat explicitní ne stránkovaný /tasks/dashboard kontrakt.',
  );
if (!taskDashboardHookSource.includes('getTaskDashboard'))
  errors.push('Dashboard hook nesmí parsovat běžný tasks list response.');
const createTaskDtoSource = await readFile(
  join(tasksDirectory, 'presentation/dto/create-task.dto.ts'),
  'utf8',
);
if (
  /IsDefined|IsNotEmpty/.test(
    createTaskDtoSource.match(/dueTimeMinutes[\s\S]{0,160}/)?.[0] ?? '',
  )
)
  errors.push('Čas termínu úkolu nesmí být povinný.');
const taskFormSource = await readFile(
  join(tasksWebDirectory, 'components/forms/TaskForm.tsx'),
  'utf8',
);
if (/30 min|1 h 30 min|\b120\b/.test(taskFormSource))
  errors.push(
    'Duration preset logika nepatří přímo do TaskForm; použij TaskDurationPresets.',
  );
try {
  await readFile(
    join(tasksWebDirectory, 'components/forms/TaskDurationPresets.tsx'),
    'utf8',
  );
} catch {
  errors.push('Tasks feature postrádá samostatné duration presety.');
}

const schedulingDirectory = join(apiSource, 'modules/scheduling');
const schedulingFiles = await collectFiles(schedulingDirectory, '.ts');
for (const file of schedulingFiles) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  const lineCount = (await readLines(file)).length;
  if (
    path.includes('/presentation/') &&
    /Prisma|@PublicEndpoint\(/.test(source)
  )
    errors.push(`${path} porušuje chráněnou HTTP hranici Scheduling modulu.`);
  if (
    !path.includes('/infrastructure/') &&
    /Prisma(?:Service|Client)/.test(source)
  )
    errors.push(`${path} přistupuje k Prisma mimo Scheduling adapter.`);
  if (
    path.includes('/application/') &&
    /\.\.\/\.\.\/(?:tasks|calendar|location)\/(?![^'"]*facade\.js)/.test(source)
  )
    errors.push(`${path} obchází veřejnou facade sousedního modulu.`);
  if (path.includes('/application/') && lineCount > 300)
    errors.push(`${path} je nepřiměřeně velký Scheduling use case.`);
  if (/Mapy|MAPY_API_KEY|mapy\.com/.test(source))
    errors.push(`${path} nesmí záviset přímo na Mapy provideru.`);
}

const schedulingWebDirectory = join(webSource, 'features/scheduling');
for (const file of [
  ...(await collectFiles(schedulingWebDirectory, '.ts')),
  ...(await collectFiles(schedulingWebDirectory, '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (
    path.includes('/components/') &&
    /\b(?:mergeBusyIntervals|freeIntervals|generateCandidateIntervals|estimateBetweenPlaces)\s*\(/.test(
      source,
    )
  )
    errors.push(
      `${path} implementuje plánovací algoritmus v React komponentě.`,
    );
  if (/\bfetch\s*\(/.test(source) && path.includes('/components/'))
    errors.push(`${path} volá fetch přímo z Scheduling komponenty.`);
}

for (const required of [
  'CalendarTimeGrid.tsx',
  'TimeGutter.tsx',
  'TimeGridLines.tsx',
  'DayColumn.tsx',
  'AllDaySection.tsx',
  'CurrentTimeIndicator.tsx',
  'CalendarEventBlock.tsx',
  'time-grid.layout.ts',
]) {
  try {
    await readFile(
      join(webSource, 'features/calendar/components/time-grid', required),
      'utf8',
    );
  } catch {
    errors.push(`Calendar time-grid postrádá ${required}.`);
  }
}

const calendarPagePath = join(
  webSource,
  'features/calendar/pages/CalendarPage.tsx',
);
try {
  const calendarPageLines = await readLines(calendarPagePath);
  if (calendarPageLines.length > 200)
    errors.push(
      `CalendarPage.tsx má ${calendarPageLines.length} řádků; limit je 200.`,
    );
} catch {
  errors.push('Chybí samostatná CalendarPage.tsx.');
}

const calendarWebDirectory = join(webSource, 'features/calendar');
for (const file of [
  ...(await collectFiles(calendarWebDirectory, '.ts')),
  ...(await collectFiles(calendarWebDirectory, '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/\bfetch\s*\(/.test(source) && path.includes('/components/'))
    errors.push(`${path} volá fetch přímo z Calendar komponenty.`);
  if (/(?:features\/tasks|\.\.\/tasks)\/(?!tasks\.public)/.test(source))
    errors.push(
      `${path} importuje interní část Tasks feature místo public API.`,
    );
  if (
    /(?:features\/household|\.\.\/household)\/(?!household\.public)/.test(
      source,
    )
  )
    errors.push(
      `${path} importuje interní část Household feature místo public API.`,
    );
  if (
    path.endsWith('.tsx') &&
    /localDateTimeCandidates|zonedPartsToInstant|resolveTemplateOccurrence|findTimezoneOffset/.test(
      source,
    )
  )
    errors.push(
      `${path} implementuje timezone/DST výpočet v React komponentě.`,
    );
  if (
    path.endsWith('.tsx') &&
    /(?:colorToken\s*[:=][^\n;]*email|calendarVisualClasses\s*\[[^\]]*email|colorClasses\s*\[[^\]]*email)/i.test(
      source,
    )
  )
    errors.push(`${path} odvozuje kalendářní barvu z e-mailu.`);
  if (
    path.includes('/components/') &&
    /departureAt\s*[:=][\s\S]{0,100}(?:getTime\(\)|durationSeconds|buffer)/.test(
      source,
    )
  )
    errors.push(`${path} počítá departureAt v React komponentě.`);
}

const calendarEventFormPath = join(
  calendarWebDirectory,
  'components/forms/CalendarEventForm.tsx',
);
const calendarEventFormLines = await readLines(calendarEventFormPath);
if (calendarEventFormLines.length > 300)
  errors.push(
    `CalendarEventForm.tsx má ${calendarEventFormLines.length} řádků; limit je 300.`,
  );
const calendarRepositorySource = await readFile(
  join(calendarDirectory, 'infrastructure/prisma-calendar-event.repository.ts'),
  'utf8',
);
if (
  !/bulkDelete[\s\S]*taskCalendarLink\.updateMany[\s\S]*removedAt/.test(
    calendarRepositorySource,
  )
)
  errors.push(
    'Hromadné mazání kalendáře musí zachovat Task a uzavřít TaskCalendarLink.',
  );

for (const file of [
  ...(await collectFiles(join(webSource, 'features/dashboard'), '.ts')),
  ...(await collectFiles(join(webSource, 'features/dashboard'), '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  if (
    /tasks?(?:Api|Repository)|(?:features\/tasks|\.\.\/tasks)\/(?!tasks\.public)/i.test(
      source,
    )
  )
    errors.push(`${relative(root, file)} obchází veřejné Tasks rozhraní.`);
}

for (const file of [
  ...(await collectFiles(join(webSource, 'features/dashboard'), '.ts')),
  ...(await collectFiles(join(webSource, 'features/dashboard'), '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  if (
    /calendar(?:Api|Repository)|(?:features\/calendar|\.\.\/calendar)\/(?!calendar\.public)/i.test(
      source,
    )
  )
    errors.push(`${relative(root, file)} obchází veřejné Calendar rozhraní.`);
}

const financeDirectory = join(apiSource, 'modules/finance');
const financeFiles = await collectFiles(financeDirectory, '.ts');
for (const file of financeFiles) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  const lineCount = (await readLines(file)).length;
  if (
    path.endsWith('.controller.ts') &&
    /Prisma(?:Service|Client)|@PublicEndpoint\(/.test(source)
  )
    errors.push(`${path} porušuje chráněnou HTTP hranici Finance modulu.`);
  if (
    /(?:DocumentsRepository|PrismaDocumentRepository|StoragePort|STORAGE_PORT)/.test(
      source,
    )
  )
    errors.push(`${path} obchází veřejný DocumentsFacade.`);
  if (
    /(?:parseFloat|Number)\s*\([^)]*(?:amount|balance|money|minor)/i.test(
      source,
    )
  )
    errors.push(`${path} používá float/Number pro peněžní hodnotu.`);
  if (path.includes('/application/') && lineCount > 300)
    errors.push(`${path} je nepřiměřeně velký Finance use case.`);
  if (/finance-service\.ts$/i.test(path))
    errors.push(`${path} zavádí zakázaný univerzální FinanceService.`);
}

const financeWebDirectory = join(webSource, 'features/finance');
for (const file of [
  ...(await collectFiles(financeWebDirectory, '.ts')),
  ...(await collectFiles(financeWebDirectory, '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/\bfetch\s*\(/.test(source) && path.includes('/components/'))
    errors.push(`${path} volá fetch přímo z Finance komponenty.`);
  if (
    /\b(?:parseFloat|Number)\s*\([^)]*(?:amount|balance|money|minor)/i.test(
      source,
    )
  )
    errors.push(`${path} používá float/Number pro peněžní hodnotu.`);
  if (
    /(?:features\/documents|\.\.\/documents)\/(?!documents\.public)/.test(
      source,
    )
  )
    errors.push(
      `${path} importuje interní Documents feature místo public API.`,
    );
}

for (const file of [...tsxFiles, ...webTsFiles]) {
  const source = await readFile(file, 'utf8');
  if (/['"`]\/app\/finance(?:[/?#'"`]|$)/.test(source))
    errors.push(
      `${relative(root, file)} vytváří zakázanou browser Finance feature URL.`,
    );
}

const transferRepositorySource = await readFile(
  join(
    financeDirectory,
    'infrastructure/prisma-financial-transfer.repository.ts',
  ),
  'utf8',
);
for (const required of [
  'this.prisma.$transaction',
  "type: 'TRANSFER_OUT'",
  "type: 'TRANSFER_IN'",
  'financialTransaction.updateMany',
]) {
  if (!transferRepositorySource.includes(required))
    errors.push(
      `Finance transfer adapter postrádá atomický invariant ${required}.`,
    );
}

const financeDashboardImportSource = (
  await Promise.all(
    [...tsxFiles, ...webTsFiles]
      .filter((file) => file.startsWith(join(webSource, 'features/dashboard')))
      .map((file) => readFile(file, 'utf8')),
  )
).join('\n');
if (
  /finance(?:Api|Repository)|(?:features\/finance|\.\.\/finance)\/(?!finance\.public)/i.test(
    financeDashboardImportSource,
  )
)
  errors.push('Dashboard obchází veřejné Finance rozhraní.');

const financialTransactionModel =
  prismaSchemaSource.match(/model FinancialTransaction \{[\s\S]*?\n\}/)?.[0] ??
  '';
if (/amountMinor\s+Float/.test(financialTransactionModel))
  errors.push('FinancialTransaction nesmí ukládat money jako Prisma Float.');
if (!/amountMinor\s+BigInt/.test(financialTransactionModel))
  errors.push('FinancialTransaction musí ukládat money jako Prisma BigInt.');

const financeImportDirectory = join(apiSource, 'modules/finance-imports');
const financeCategorizationDirectory = join(
  apiSource,
  'modules/finance-categorization',
);
const financeAnalyticsDirectory = join(apiSource, 'modules/finance-analytics');
const financeBudgetsDirectory = join(apiSource, 'modules/finance-budgets');
for (const directory of [
  financeImportDirectory,
  financeCategorizationDirectory,
  financeAnalyticsDirectory,
]) {
  for (const file of await collectFiles(directory, '.ts')) {
    const source = await readFile(file, 'utf8');
    const path = relative(root, file);
    const lineCount = (await readLines(file)).length;
    if (
      path.endsWith('.controller.ts') &&
      /Prisma(?:Service|Client)|@PublicEndpoint\(/.test(source)
    )
      errors.push(`${path} porušuje chráněnou Finance HTTP hranici.`);
    if (path.includes('/application/') && lineCount > 300)
      errors.push(`${path} je nepřiměřeně velký Finance use case.`);
    if (/finance-(?:imports|analytics|categorization)-service\.ts$/i.test(path))
      errors.push(`${path} zavádí zakázaný univerzální Finance service.`);
  }
}

for (const file of await collectFiles(financeBudgetsDirectory, '.ts')) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  const lineCount = (await readLines(file)).length;
  if (
    path.endsWith('.controller.ts') &&
    /Prisma(?:Service|Client)|@PublicEndpoint\(|median|evidenceHash|detectInsights|forecastSpending/.test(
      source,
    )
  )
    errors.push(`${path} porušuje chráněnou HTTP hranici Finance Budgets.`);
  if (/modules\/(?:finance|finance-analytics)\/infrastructure\//.test(source))
    errors.push(
      `${path} importuje cizí Finance Prisma adapter místo veřejné facade.`,
    );
  if (
    /(?:parseFloat|Number)\s*\([^)]*(?:netSpentMinor|amountMinor|limitMinor|forecastMinor)/.test(
      source,
    )
  )
    errors.push(`${path} používá float/Number pro peněžní forecast.`);
  if (
    path.includes('/application/') &&
    /evidence[^\n]*(?:counterpartyAccount|variableSymbol|specificSymbol|rawRow|rawCsv|description)/i.test(
      source,
    )
  )
    errors.push(`${path} vkládá raw bankovní údaj do insight evidence.`);
  if (path.includes('/application/') && lineCount > 300)
    errors.push(`${path} je nepřiměřeně velký Finance Budgets use case.`);
  if (/spending-analyzer-service\.ts$/i.test(path))
    errors.push(`${path} zavádí zakázaný univerzální SpendingAnalyzerService.`);
}

const financeBudgetsWebDirectory = join(webSource, 'features/finance-budgets');
for (const file of [
  ...(await collectFiles(financeBudgetsWebDirectory, '.ts')),
  ...(await collectFiles(financeBudgetsWebDirectory, '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/\bfetch\s*\(/.test(source) && path.includes('/components/'))
    errors.push(`${path} volá fetch přímo z Finance Budgets komponenty.`);
  if (
    path.includes('/components/') &&
    /netSpentMinor\s*[/*+-]\s*(?:limitMinor|daysElapsed)|forecastMinor\s*=/.test(
      source,
    )
  )
    errors.push(`${path} počítá rozpočtové čerpání v React komponentě.`);
}

const budgetCalculationSource = await readFile(
  join(financeBudgetsDirectory, 'domain/budget-calculations.ts'),
  'utf8',
);
for (const required of [
  "transaction.type === 'EXPENSE'",
  "transaction.type === 'REFUND'",
]) {
  if (!budgetCalculationSource.includes(required))
    errors.push(`Budget calculations postrádají ledger pravidlo ${required}.`);
}
if (/TRANSFER_(?:IN|OUT)|CARD_REPAYMENT/.test(budgetCalculationSource))
  errors.push(
    'Převody ani splátka kreditní karty nesmějí vstoupit do budget expense výpočtu.',
  );
const budgetSummarySource = await readFile(
  join(financeBudgetsDirectory, 'application/budget-summary.service.ts'),
  'utf8',
);
if (!/currencyCode:\s*budget\.currencyCode/.test(budgetSummarySource))
  errors.push('Budget summary musí omezit finance data měnou rozpočtu.');

for (const modelName of [
  'FinancialBudget',
  'FinancialBudgetAllocation',
  'RecurringExpenseCandidate',
  'RecurringExpense',
]) {
  const model =
    prismaSchemaSource.match(
      new RegExp(`model ${modelName} \\{[\\s\\S]*?\\n\\}`),
    )?.[0] ?? '';
  if (/Minor\s+Float/.test(model))
    errors.push(`${modelName} nesmí ukládat minor units jako Float.`);
}

for (const file of await collectFiles(financeImportDirectory, '.ts')) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (
    /\bStoragePort\b|STORAGE_PORT/.test(source) &&
    !path.endsWith('storage-temporary-import-file.adapter.ts')
  )
    errors.push(`${path} obchází TemporaryImportFilePort.`);
  if (
    /finance-categorization\/(?:application|domain|infrastructure|presentation)\//.test(
      source,
    )
  )
    errors.push(
      `${path} importuje interní kategorizaci místo veřejného rozhraní.`,
    );
}

for (const file of [
  ...tsxFiles.filter((path) =>
    /features\/finance-(?:imports|categorization|analytics)\//.test(path),
  ),
  ...webTsFiles.filter((path) =>
    /features\/finance-(?:imports|categorization|analytics)\//.test(path),
  ),
]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/\bfetch\s*\(/.test(source) && path.includes('/components/'))
    errors.push(`${path} volá fetch přímo z Finance komponenty.`);
  if (
    path.includes('/types/') &&
    /\b(?:storageKey|temporaryStorageKey|rawRow|rawCsv)\b/.test(source)
  )
    errors.push(`${path} vystavuje interní CSV/storage data klientovi.`);
}

const financeApiSource = await readFile(
  join(financeWebDirectory, 'api/financeApi.ts'),
  'utf8',
);
if (!financeApiSource.includes("'/finance/analytics/dashboard'"))
  errors.push('Finance dashboard musí používat analytický dashboard kontrakt.');

if (/amountMinor\s+Float|creditLimitMinor\s+Float/.test(prismaSchemaSource))
  errors.push('Finance money pole nesmí používat Prisma Float.');

for (const file of apiFiles) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  const isStorageInfrastructure = path.startsWith(
    'apps/api/src/infrastructure/storage/',
  );
  const isLocalDevelopmentTool = path.startsWith(
    'apps/api/src/modules/document-extraction/tools/',
  );
  const isConfigurationSecretResolver =
    path === 'apps/api/src/config/secret-file-resolver.ts';
  if (
    !isStorageInfrastructure &&
    !isLocalDevelopmentTool &&
    !isConfigurationSecretResolver &&
    /from\s+['"](?:node:fs|fs(?:\/promises)?)/.test(source)
  )
    errors.push(`${path} provádí filesystem operace mimo StoragePort.`);
}

const extractionDirectory = join(apiSource, 'modules/document-extraction');
const extractionFiles = await collectFiles(extractionDirectory, '.ts');
for (const file of extractionFiles) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/\bStoragePort\b|STORAGE_PORT/.test(source))
    errors.push(`${path} obchází veřejné DocumentsFacade rozhraní.`);
  if (
    !path.includes('/infrastructure/') &&
    /Prisma(?:Service|Client)/.test(source)
  )
    errors.push(`${path} přistupuje k Prisma mimo infrastrukturní adapter.`);
  if (path.includes('/application/') && (await readLines(file)).length > 240)
    errors.push(
      `${path} je nepřiměřeně velký extrakční use case; limit je 240 řádků.`,
    );
}

for (const required of [
  'application/classification/document-classification.service.ts',
  'application/layout/layout-analysis.service.ts',
  'application/supplier/supplier-profile-registry.service.ts',
  'application/invoice/generic-invoice-extractor.service.ts',
  'application/invoice/line-item-extraction.service.ts',
  'application/normalization/invoice-normalizers.ts',
  'application/invoice/cross-field-validation.service.ts',
  'application/confidence/confidence-calculation.service.ts',
  'domain/image-ocr.port.ts',
  'domain/structured-ai-extractor.port.ts',
  'tools/evaluate-extraction.ts',
]) {
  try {
    await readFile(join(extractionDirectory, required), 'utf8');
  } catch {
    errors.push(`Extrakční pipeline postrádá samostatnou fázi ${required}.`);
  }
}
for (const file of extractionFiles) {
  const name = relative(extractionDirectory, file);
  if (/invoice-extractor\.service\.ts$/i.test(name)) {
    const lineCount = (await readLines(file)).length;
    if (lineCount > 240)
      errors.push(`${relative(root, file)} je monolitický invoice extractor.`);
  }
}

const documentsPagePath = join(
  webSource,
  'features/documents/pages/DocumentsPage.tsx',
);
try {
  const lines = await readLines(documentsPagePath);
  if (lines.length > 200)
    errors.push(
      `DocumentsPage.tsx má ${lines.length} řádků; bezpečnostní hranice je 200.`,
    );
} catch {
  errors.push('Chybí samostatná DocumentsPage.tsx.');
}

const documentsWebDirectory = join(webSource, 'features/documents');
for (const file of [
  ...(await collectFiles(documentsWebDirectory, '.ts')),
  ...(await collectFiles(documentsWebDirectory, '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  if (/\bStoragePort\b/.test(source))
    errors.push(
      `${relative(root, file)} přistupuje k backendovému StoragePort.`,
    );
  if (/\bstorageKey\b/.test(source))
    errors.push(`${relative(root, file)} vystavuje interní storageKey.`);
  if (/\bwindow\.confirm\s*\(/.test(source))
    errors.push(
      `${relative(root, file)} používá browserový confirm místo přístupného dialogu.`,
    );
}

for (const listComponent of [
  'components/library/DocumentDesktopTable.tsx',
  'components/library/DocumentMobileList.tsx',
]) {
  const path = join(documentsWebDirectory, listComponent);
  const source = await readFile(path, 'utf8');
  if (/metadata(?:Json)?\s*\[|\.metadata(?:Json)?\b/.test(source))
    errors.push(
      `${relative(root, path)} interpretuje metadata místo serverového prezentačního modelu.`,
    );
}

for (const required of [
  'components/modals/DocumentPreviewDialog.tsx',
  'components/modals/DocumentEditDialog.tsx',
  'components/modals/DocumentMoveDialog.tsx',
  'components/modals/DocumentLifecycleDialog.tsx',
]) {
  try {
    await readFile(join(documentsWebDirectory, required), 'utf8');
  } catch {
    errors.push(`Documents feature postrádá adaptivní modal ${required}.`);
  }
}

const documentResponseMapper = await readFile(
  join(
    apiSource,
    'modules/documents/application/mappers/document-response.mapper.ts',
  ),
  'utf8',
);
if (/\bstorageKey\b/.test(documentResponseMapper))
  errors.push('Veřejný DocumentResponse nesmí obsahovat storageKey.');

const prismaSchema = await readFile(
  join(root, 'apps/api/prisma/schema.prisma'),
  'utf8',
);
const householdProvisioningSource = await readFile(
  join(apiSource, 'modules/households/household-provisioning.service.ts'),
  'utf8',
);
if (!householdProvisioningSource.includes('singleHouseholdBootstrap'))
  errors.push(
    'Single-household provisioning nepoužívá stabilní bootstrap pointer.',
  );
if (
  /household\.(?:findFirst|findUnique)\([\s\S]{0,200}where:\s*\{\s*name:/m.test(
    householdProvisioningSource,
  )
)
  errors.push(
    'Single-household provisioning nesmí vyhledávat domácnost pouze podle názvu.',
  );

for (const forbiddenEnv of [
  join(root, 'apps/api/.env'),
  join(root, 'apps/api/.env.example'),
  join(root, 'apps/web/.env'),
  join(root, 'apps/web/.env.example'),
]) {
  try {
    await readFile(forbiddenEnv, 'utf8');
    errors.push(
      `${relative(root, forbiddenEnv)} je zakázaný app-level environment soubor.`,
    );
  } catch {
    // Expected: the root .env is the single configuration source.
  }
}
for (const required of [
  'TRASHED',
  'model StoredFileDeletionTask',
  'confidenceReasonsJson',
  'sourceRegionJson',
]) {
  if (!prismaSchema.includes(required))
    errors.push(
      `Prisma schema postrádá lifecycle/extraction prvek ${required}.`,
    );
}
for (const required of [
  'model SingleHouseholdBootstrap',
  'model CalendarEvent',
  'model CalendarEventParticipant',
  'model CalendarTemplate',
  'model CalendarTemplateApplicationBatch',
  'model SavedPlace',
  'model CalendarUserPreference',
  'model CalendarEventTravelPlan',
]) {
  if (!prismaSchema.includes(required))
    errors.push(`Prisma schema postrádá workspace/calendar prvek ${required}.`);
}

const calendarEventModelBody = prismaSchema.match(
  /model\s+CalendarEvent\s*\{([\s\S]*?)\n\}/,
)?.[1];
if (
  calendarEventModelBody &&
  /TRAVEL_BLOCK|travelBlock/.test(calendarEventModelBody)
)
  errors.push('Odvozený travel block nesmí být uložen jako CalendarEvent.');
if (
  calendarEventModelBody &&
  (!/startsAt\s+DateTime\?/.test(calendarEventModelBody) ||
    !/endsAt\s+DateTime\?/.test(calendarEventModelBody) ||
    !/allDayStartDate\s+DateTime\?\s+@db\.Date/.test(calendarEventModelBody) ||
    !/allDayEndDateExclusive\s+DateTime\?\s+@db\.Date/.test(
      calendarEventModelBody,
    ))
)
  errors.push(
    'CalendarEvent musí reprezentovat all-day události explicitními DATE hranicemi, ne falešnou půlnocí.',
  );
if (
  /\bVITE_MAPY_API_KEY\s*=/.test(
    await readFile(join(root, '.env.example'), 'utf8'),
  )
)
  errors.push('.env.example nesmí vystavovat MAPY_API_KEY přes VITE prefix.');

const taskModelBody = prismaSchema.match(
  /model\s+Task\s*\{([\s\S]*?)\n\}/,
)?.[1];
if (taskModelBody && /calendarEventId\s+String/.test(taskModelBody))
  errors.push(
    'Task nesmí přímo vlastnit CalendarEvent; propojení vlastní TaskCalendarLink.',
  );
for (const match of prismaSchema.matchAll(
  /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g,
)) {
  const [, modelName, body] = match;
  if (
    modelName !== 'AuditLog' &&
    /\bentityType\b/.test(body) &&
    /\bentityId\b/.test(body)
  )
    errors.push(
      `Prisma model ${modelName} zavádí neschválenou polymorfní vazbu entityType/entityId.`,
    );
}

const bucketListApiDirectory = join(apiSource, 'modules/bucket-list');
const bucketListWebDirectory = join(webSource, 'features/bucket-list');
for (const required of [
  'bucket-list.module.ts',
  'application/bucket-list.service.ts',
  'application/bucket-list-item.service.ts',
  'application/bucket-list-lifecycle.service.ts',
  'application/bucket-list-rollover.service.ts',
  'infrastructure/prisma-bucket-list.repository.ts',
  'presentation/bucket-lists.controller.ts',
  'presentation/bucket-list-items.controller.ts',
]) {
  try {
    await readFile(join(bucketListApiDirectory, required), 'utf8');
  } catch {
    errors.push(`Bucket list modul postrádá samostatný soubor ${required}.`);
  }
}
for (const file of await collectFiles(bucketListApiDirectory, '.ts')) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  const lineCount = (await readLines(file)).length;
  if (
    path.endsWith('.controller.ts') &&
    /Prisma(?:Service|Client)|@PublicEndpoint\(/.test(source)
  )
    errors.push(`${path} porušuje chráněnou HTTP hranici Bucket list modulu.`);
  if (
    !path.includes('/infrastructure/') &&
    /Prisma(?:Service|Client)/.test(source)
  )
    errors.push(`${path} přistupuje k Prisma mimo infrastrukturní adapter.`);
  if (/\b(?:TasksRepository|TaskService|TasksFacade)\b/.test(source))
    errors.push(`${path} převádí Bucket list na úkolovou doménu.`);
  if (
    /modules\/documents\/(?:application|domain|infrastructure|presentation)\//.test(
      source,
    )
  )
    errors.push(`${path} obchází veřejný DocumentsFacade.`);
  if (path.includes('/application/') && lineCount > 300)
    errors.push(`${path} je nepřiměřeně velký Bucket list use case.`);
}
for (const file of [
  ...(await collectFiles(bucketListWebDirectory, '.ts')),
  ...(await collectFiles(bucketListWebDirectory, '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (/\bfetch\s*\(/.test(source) && path.includes('/components/'))
    errors.push(`${path} volá fetch přímo z Bucket list komponenty.`);
  if (
    /(?:features\/documents|\.\.\/documents)\/(?!documents\.public)/.test(
      source,
    )
  )
    errors.push(`${path} importuje interní Documents feature.`);
  if (
    /(?:features\/location|\.\.\/location)\/(?!location\.public)/.test(source)
  )
    errors.push(`${path} importuje interní Location feature.`);
  if (/['"`]\/app\/(?:bucket|wish|goal)/.test(source))
    errors.push(`${path} vytváří zakázanou browser Bucket list URL.`);
}
const bucketDashboardSource = await readFile(
  join(webSource, 'features/dashboard/components/DashboardOverview.tsx'),
  'utf8',
);
if (!bucketDashboardSource.includes('../../bucket-list/bucket-list.public.js'))
  errors.push(
    'Dashboard musí Bucket list používat přes explicitní public API.',
  );
if (
  /bucket-list\/(?:api|hooks|infrastructure|application)\//.test(
    bucketDashboardSource,
  )
)
  errors.push('Dashboard obchází veřejné Bucket list rozhraní.');
for (const required of [
  'model YearlyBucketList',
  'model BucketListItem',
  'model BucketListItemParticipant',
  'model BucketListItemDocument',
  'model BucketListItemCompletion',
]) {
  if (!prismaSchema.includes(required))
    errors.push(`Prisma schema postrádá Bucket list prvek ${required}.`);
}

const expeditionsApiDirectory = join(apiSource, 'modules/expeditions');
const expeditionsWebDirectory = join(webSource, 'features/expeditions');
for (const required of [
  'expeditions.module.ts',
  'expeditions.facade.ts',
  'expeditions-search.provider.ts',
  'application/gear.service.ts',
  'application/pack-templates.service.ts',
  'application/trips.service.ts',
  'application/trip-packing.service.ts',
  'domain/expedition-weight.service.ts',
  'domain/trip-readiness.service.ts',
  'images/gear-image-search.port.ts',
  'images/node-gear-image-http.adapter.ts',
  'presentation/gear.controller.ts',
  'presentation/pack-templates.controller.ts',
  'presentation/trips.controller.ts',
]) {
  try {
    await readFile(join(expeditionsApiDirectory, required), 'utf8');
  } catch {
    errors.push(`Expeditions modul postrádá samostatný soubor ${required}.`);
  }
}
for (const file of await collectFiles(expeditionsApiDirectory, '.ts')) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (
    path.endsWith('.controller.ts') &&
    /Prisma(?:Service|Client)|@PublicEndpoint\(/.test(source)
  )
    errors.push(`${path} porušuje chráněnou HTTP hranici Expeditions modulu.`);
  if (
    /modules\/documents\/(?:application|domain|infrastructure|presentation)\//.test(
      source,
    )
  )
    errors.push(`${path} obchází veřejný DocumentsFacade.`);
  if (
    /modules\/tasks\/(?!tasks\.facade)/.test(source) &&
    !path.endsWith('expeditions.module.ts')
  )
    errors.push(`${path} obchází veřejný TasksFacade.`);
  if (
    path.includes('/images/') &&
    /\b(?:readFile|writeFile|createWriteStream|createReadStream)\b/.test(source)
  )
    errors.push(
      `${path} zavádí vlastní file storage místo DocumentsFacade/StoragePort.`,
    );
  if (
    path !==
      'apps/api/src/modules/expeditions/domain/expedition-weight.service.ts' &&
    /\.(?:mul|times)\s*\(\s*item\.unitWeightGrams|unitWeightGrams\s*\*\s*(?:quantity|item\.)/.test(
      source,
    )
  )
    errors.push(`${path} počítá hmotnost mimo centrální doménovou službu.`);
}
for (const file of [
  ...(await collectFiles(expeditionsWebDirectory, '.ts')),
  ...(await collectFiles(expeditionsWebDirectory, '.tsx')),
]) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (
    /(?:features\/documents|\.\.\/documents)\/(?!documents\.public)/.test(
      source,
    )
  )
    errors.push(`${path} importuje interní Documents feature.`);
  if (/['"`]\/app\/(?:trips|gear|expeditions|pack)/.test(source))
    errors.push(`${path} vytváří zakázanou browser URL Výprav.`);
  if (
    /unitWeightGrams\s*\*\s*(?:Number|parseFloat|\w+\.quantity)|(?:Number|parseFloat)\([^)]*quantity[^)]*\)\s*\*\s*unitWeightGrams/.test(
      source,
    )
  )
    errors.push(`${path} počítá gramovou geometrii přímo v Reactu.`);
}
const expeditionDashboardSource = await readFile(
  join(webSource, 'features/dashboard/components/DashboardOverview.tsx'),
  'utf8',
);
if (
  !expeditionDashboardSource.includes('../../expeditions/expeditions.public.js')
)
  errors.push(
    'Dashboard musí Výpravy používat přes explicitní expeditions.public API.',
  );
for (const required of [
  'model GearCategory',
  'model GearItem',
  'model GearItemDocument',
  'model PackTemplate',
  'model PackTemplateItem',
  'model Trip',
  'model TripParticipant',
  'model TripPackItem',
  'model TripTaskLink',
]) {
  if (!prismaSchema.includes(required))
    errors.push(`Prisma schema postrádá Expeditions prvek ${required}.`);
}

const searchDirectory = join(apiSource, 'modules/search');
const searchControllerSource = await readFile(
  join(searchDirectory, 'presentation/search.controller.ts'),
  'utf8',
);
const searchServiceSource = await readFile(
  join(searchDirectory, 'application/search.service.ts'),
  'utf8',
);
if (
  !searchControllerSource.includes('@Post()') ||
  /@Get\s*\(/.test(searchControllerSource)
)
  errors.push('Celoaplikační hledání musí používat výhradně POST kontrakt.');
if (!searchControllerSource.includes('private, no-store'))
  errors.push('Search response musí zakazovat sdílenou i perzistentní cache.');
for (const file of await collectFiles(searchDirectory, '.ts')) {
  const source = await readFile(file, 'utf8');
  const path = relative(root, file);
  if (
    /Prisma(?:Service|Client)|\$queryRaw|modules\/.+\/infrastructure\//.test(
      source,
    )
  )
    errors.push(`${path} obchází federované module search providery.`);
  if (
    /SELECT[\s\S]+FROM\s+["'][^"']+["'][\s\S]+JOIN\s+["'][^"']+["']/.test(
      source,
    )
  )
    errors.push(`${path} zavádí centrální SQL dotaz přes doménové tabulky.`);
}
if (
  /logger\.(?:log|warn|error)\s*\([^)]*(?:query|normalizedQuery)/.test(
    searchServiceSource,
  )
)
  errors.push('Search orchestrace nesmí logovat hledaný text.');

const providerFiles = [
  join(apiSource, 'modules/documents/search/documents-search.provider.ts'),
  join(apiSource, 'modules/tasks/search/tasks-search.provider.ts'),
  join(apiSource, 'modules/maintenance/search/maintenance-search.provider.ts'),
  join(apiSource, 'modules/calendar/search/calendar-search.provider.ts'),
  join(apiSource, 'modules/finance/search/finance-search.provider.ts'),
  join(
    apiSource,
    'modules/bucket-list/infrastructure/bucket-list-search.provider.ts',
  ),
  join(apiSource, 'modules/meals/search/meals-search.provider.ts'),
  join(apiSource, 'modules/expeditions/expeditions-search.provider.ts'),
];
for (const file of providerFiles) {
  const source = await readFile(file, 'utf8');
  if (
    !source.includes('context.householdId') ||
    source.includes('@PublicEndpoint')
  )
    errors.push(
      `${relative(root, file)} neomezuje search na ověřenou domácnost.`,
    );
}
const financeSearchSource = await readFile(
  join(apiSource, 'modules/finance/search/finance-search.provider.ts'),
  'utf8',
);
for (const forbidden of [
  'counterpartyAccount',
  'fingerprint',
  'externalTransactionId',
  'importSessionId',
  'importRowId',
]) {
  if (financeSearchSource.includes(forbidden))
    errors.push(`Finance search vrací zakázané interní pole ${forbidden}.`);
}

const webSearchDirectory = join(webSource, 'features/global-search');
const webSearchApiSource = await readFile(
  join(webSearchDirectory, 'api/searchApi.ts'),
  'utf8',
);
const webSearchPaletteSource = await readFile(
  join(webSearchDirectory, 'components/GlobalSearchPalette.tsx'),
  'utf8',
);
if (
  !webSearchApiSource.includes("method: 'POST'") ||
  /\/search\?/.test(webSearchApiSource)
)
  errors.push('Frontend search musí posílat dotaz pouze v POST body.');
if (
  /TaskCreateDialog|EventCreateDialog|RecipeDialog|TripDialog|GearItemDialog/.test(
    webSearchPaletteSource,
  )
)
  errors.push('Command palette kopíruje formulář místo overlay registry.');
if (
  /window\.history|location\.(?:href|assign)|['"]\/app\//.test(
    webSearchPaletteSource,
  )
)
  errors.push('Search mění browser URL mimo typovanou workspace navigaci.');
const recentSearchSource = await readFile(recentSearchStoragePath, 'utf8');
for (const forbidden of ['snippet', 'subtitle', 'query', 'amount']) {
  if (new RegExp(`\\b${forbidden}\\s*:`).test(recentSearchSource))
    errors.push(`Recent search storage persistuje zakázané pole ${forbidden}.`);
}

const gitignore = await readFile(join(root, '.gitignore'), 'utf8');
for (const required of [
  '/database/*',
  '!/database/.gitkeep',
  '/uploads/*',
  '!/uploads/.gitkeep',
]) {
  if (!gitignore.includes(required))
    errors.push(`.gitignore neobsahuje povinné pravidlo ${required}.`);
}

if (errors.length > 0) {
  console.error(`Architektonická kontrola selhala:\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Architektonická kontrola prošla (${tsxFiles.length} produkčních TSX souborů).`,
  );
}
