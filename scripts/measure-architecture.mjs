import { readFile, readdir } from 'node:fs/promises';
import {
  basename,
  dirname,
  extname,
  join,
  normalize,
  relative,
  resolve,
} from 'node:path';
import process from 'node:process';

const argumentsList = process.argv.slice(2);
const rootArgument = argumentsList.find((argument) =>
  argument.startsWith('--root='),
);
const root = rootArgument
  ? resolve(process.cwd(), rootArgument.slice('--root='.length))
  : process.cwd();
const jsonOutput = argumentsList.includes('--json');
const unknownArguments = argumentsList.filter(
  (argument) =>
    !['--', '--json'].includes(argument) && !argument.startsWith('--root='),
);

if (unknownArguments.length > 0) {
  throw new Error(`Neznámé argumenty: ${unknownArguments.join(', ')}`);
}

const excludedDirectories = new Set([
  '.git',
  '.pnpm-store',
  'coverage',
  'dist',
  'fixtures',
  '__fixtures__',
  'generated',
  'node_modules',
  'playwright-report',
  'storybook-static',
  'test-results',
  'vendor',
]);

const sourceExtensions = new Set(['.ts', '.tsx']);
const testFilePattern = /\.(?:spec|test)\.[cm]?[jt]sx?$/;
const nonProductionFilePattern =
  /\.(?:spec|test|stories|fixture)\.[cm]?[jt]sx?$/;
const compareText = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

async function collectFiles(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) =>
    compareText(left.name, right.name),
  )) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...(await collectFiles(path, predicate)));
    if (entry.isFile() && predicate(path)) files.push(path);
  }
  return files;
}

const countLines = (source) => {
  if (source.length === 0) return 0;
  const lines = source.split(/\r?\n/).length;
  return source.endsWith('\n') ? lines - 1 : lines;
};

async function listDirectories(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter(
      (entry) => entry.isDirectory() && !excludedDirectories.has(entry.name),
    )
    .map((entry) => entry.name)
    .sort();
}

const apiSourceRoot = join(root, 'apps/api/src');
const webSourceRoot = join(root, 'apps/web/src');
const apiModulesRoot = join(apiSourceRoot, 'modules');
const webFeaturesRoot = join(webSourceRoot, 'features');

const productionFiles = [
  ...(await collectFiles(
    apiSourceRoot,
    (path) =>
      sourceExtensions.has(extname(path)) &&
      !nonProductionFilePattern.test(path),
  )),
  ...(await collectFiles(
    webSourceRoot,
    (path) =>
      sourceExtensions.has(extname(path)) &&
      !nonProductionFilePattern.test(path),
  )),
].sort();

const productionSources = new Map(
  await Promise.all(
    productionFiles.map(async (path) => [path, await readFile(path, 'utf8')]),
  ),
);

const largestFiles = productionFiles
  .map((path) => ({
    path: relative(root, path),
    lines: countLines(productionSources.get(path) ?? ''),
  }))
  .sort(
    (left, right) =>
      right.lines - left.lines || compareText(left.path, right.path),
  )
  .slice(0, 20);

const prismaSchema = await readFile(
  join(root, 'apps/api/prisma/schema.prisma'),
  'utf8',
);
const prismaModels = [
  ...prismaSchema.matchAll(/^model\s+([A-Za-z][A-Za-z0-9_]*)\s*\{/gm),
]
  .map((match) => match[1])
  .sort();
const prismaEnums = [
  ...prismaSchema.matchAll(/^enum\s+([A-Za-z][A-Za-z0-9_]*)\s*\{/gm),
]
  .map((match) => match[1])
  .sort();
const migrations = await listDirectories(
  join(root, 'apps/api/prisma/migrations'),
);
const backendModules = await listDirectories(apiModulesRoot);
const frontendFeatures = await listDirectories(webFeaturesRoot);

function relativeImports(source) {
  const imports = [];
  const patterns = [
    /\bfrom\s*['"](\.[^'"]+)['"]/g,
    /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g,
    /^\s*import\s*['"](\.[^'"]+)['"]/gm,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) imports.push(match[1]);
  }
  return [...new Set(imports)].sort();
}

function ownerWithin(path, boundaryRoot) {
  const pathFromBoundary = relative(boundaryRoot, path);
  if (pathFromBoundary.startsWith('..')) return null;
  return pathFromBoundary.split(/[\\/]/)[0] ?? null;
}

function isBackendPublicTarget(targetPath, owner) {
  const targetWithinModule = relative(join(apiModulesRoot, owner), targetPath);
  const targetName = basename(targetWithinModule).replace(/\.(?:js|ts)$/, '');
  return (
    targetWithinModule.split(/[\\/]/).includes('public') ||
    targetName === `${owner}.module` ||
    targetName.endsWith('.facade') ||
    targetName.endsWith('.public')
  );
}

function isFrontendPublicTarget(targetPath, owner) {
  const targetWithinFeature = relative(
    join(webFeaturesRoot, owner),
    targetPath,
  );
  const targetName = basename(targetWithinFeature).replace(
    /\.(?:js|jsx|ts|tsx)$/,
    '',
  );
  return (
    targetWithinFeature.split(/[\\/]/).includes('public') ||
    targetName === `${owner}.public` ||
    targetName.endsWith('.public')
  );
}

function boundaryImports(boundaryRoot, isPublicTarget) {
  const imports = [];
  for (const [sourcePath, source] of productionSources) {
    const sourceOwner = ownerWithin(sourcePath, boundaryRoot);
    if (!sourceOwner) continue;
    for (const specifier of relativeImports(source)) {
      const targetPath = normalize(resolve(dirname(sourcePath), specifier));
      const targetOwner = ownerWithin(targetPath, boundaryRoot);
      if (!targetOwner || targetOwner === sourceOwner) continue;
      imports.push({
        source: relative(root, sourcePath),
        sourceOwner,
        targetOwner,
        specifier,
        deep: !isPublicTarget(targetPath, targetOwner),
      });
    }
  }
  imports.sort(
    (left, right) =>
      compareText(left.source, right.source) ||
      compareText(left.specifier, right.specifier),
  );
  const edges = new Map();
  for (const item of imports) {
    const key = `${item.sourceOwner} -> ${item.targetOwner}`;
    const current = edges.get(key) ?? { imports: 0, deep: 0 };
    current.imports += 1;
    if (item.deep) current.deep += 1;
    edges.set(key, current);
  }
  return {
    total: imports.length,
    deep: imports.filter((item) => item.deep).length,
    edges: [...edges.entries()]
      .map(([edge, counts]) => ({ edge, ...counts }))
      .sort((left, right) => compareText(left.edge, right.edge)),
    deepExamples: imports.filter((item) => item.deep).slice(0, 25),
  };
}

function occurrenceReport(patterns) {
  const byKind = Object.fromEntries(
    Object.keys(patterns).map((key) => [key, 0]),
  );
  const files = [];
  for (const [path, source] of productionSources) {
    const counts = {};
    for (const [kind, pattern] of Object.entries(patterns)) {
      const count = [...source.matchAll(pattern)].length;
      byKind[kind] += count;
      if (count > 0) counts[kind] = count;
    }
    if (Object.keys(counts).length > 0)
      files.push({ path: relative(root, path), counts });
  }
  return {
    total: Object.values(byKind).reduce((sum, count) => sum + count, 0),
    byKind,
    files,
  };
}

const technicalMarkers = occurrenceReport({
  TODO: /\bTODO\b/g,
  FIXME: /\bFIXME\b/g,
});
const suppressions = occurrenceReport({
  eslintDisable: /eslint-disable(?:-next-line|-line)?/g,
  tsIgnore: /@ts-ignore\b/g,
  tsExpectError: /@ts-expect-error\b/g,
  tsNoCheck: /@ts-nocheck\b/g,
});

const testFiles = await collectFiles(join(root, 'apps'), (path) =>
  testFilePattern.test(path),
);
const testFilesByWorkspace = { api: 0, web: 0, other: 0 };
let staticTestDeclarations = 0;
for (const path of testFiles) {
  const workspacePath = relative(join(root, 'apps'), path).split(/[\\/]/)[0];
  if (workspacePath === 'api' || workspacePath === 'web')
    testFilesByWorkspace[workspacePath] += 1;
  else testFilesByWorkspace.other += 1;
  const source = await readFile(path, 'utf8');
  staticTestDeclarations += [
    ...source.matchAll(
      /\b(?:it|test)(?:\.(?:skip|only|todo|concurrent|each))?\s*\(/g,
    ),
  ].length;
}

const apiProductionFiles = productionFiles.filter((path) =>
  path.startsWith(`${apiSourceRoot}/`),
);
const webProductionFiles = productionFiles.filter((path) =>
  path.startsWith(`${webSourceRoot}/`),
);
const countByExtension = (files, extension) =>
  files.filter((path) => extname(path) === extension).length;

const metrics = {
  schemaVersion: 1,
  scope: {
    productionRoots: ['apps/api/src', 'apps/web/src'],
    excludedDirectories: [...excludedDirectories].sort(),
    deepImportDefinition:
      'Cross-boundary relative import whose target is outside public/, *.public, *.facade or the target Nest module entrypoint.',
    staticTestDefinition:
      'Syntactic it()/test() declaration count; parameterized runtime cases are not expanded.',
  },
  prisma: {
    modelCount: prismaModels.length,
    enumCount: prismaEnums.length,
    migrationCount: migrations.length,
    models: prismaModels,
    enums: prismaEnums,
    migrations,
  },
  modules: {
    backendCount: backendModules.length,
    frontendFeatureCount: frontendFeatures.length,
    backend: backendModules,
    frontendFeatures,
  },
  productionSource: {
    totalFiles: productionFiles.length,
    ts: countByExtension(productionFiles, '.ts'),
    tsx: countByExtension(productionFiles, '.tsx'),
    api: {
      files: apiProductionFiles.length,
      ts: countByExtension(apiProductionFiles, '.ts'),
      tsx: countByExtension(apiProductionFiles, '.tsx'),
    },
    web: {
      files: webProductionFiles.length,
      ts: countByExtension(webProductionFiles, '.ts'),
      tsx: countByExtension(webProductionFiles, '.tsx'),
    },
    largestFiles,
  },
  relativeBoundaryImports: {
    backend: boundaryImports(apiModulesRoot, isBackendPublicTarget),
    frontend: boundaryImports(webFeaturesRoot, isFrontendPublicTarget),
  },
  technicalMarkers,
  suppressions,
  tests: {
    specFileCount: testFiles.length,
    filesByWorkspace: testFilesByWorkspace,
    staticTestDeclarations,
  },
};

if (jsonOutput) {
  process.stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
} else {
  const lines = [
    'Architecture metrics',
    `Prisma: ${metrics.prisma.modelCount} models, ${metrics.prisma.enumCount} enums, ${metrics.prisma.migrationCount} migrations`,
    `Modules: ${metrics.modules.backendCount} backend, ${metrics.modules.frontendFeatureCount} frontend features`,
    `Production TS/TSX: ${metrics.productionSource.totalFiles} files (${metrics.productionSource.ts} TS, ${metrics.productionSource.tsx} TSX; API ${metrics.productionSource.api.files}, web ${metrics.productionSource.web.files})`,
    `Relative boundary imports: backend ${metrics.relativeBoundaryImports.backend.total} (${metrics.relativeBoundaryImports.backend.deep} deep), frontend ${metrics.relativeBoundaryImports.frontend.total} (${metrics.relativeBoundaryImports.frontend.deep} deep)`,
    `TODO/FIXME: ${metrics.technicalMarkers.total}; lint/TS suppressions: ${metrics.suppressions.total}`,
    `Tests: ${metrics.tests.specFileCount} spec files, ${metrics.tests.staticTestDeclarations} static test declarations`,
    '',
    'Largest production files:',
    ...metrics.productionSource.largestFiles.map(
      (file) => `  ${String(file.lines).padStart(4)}  ${file.path}`,
    ),
    '',
    'Deep backend import examples:',
    ...metrics.relativeBoundaryImports.backend.deepExamples.map(
      (item) => `  ${item.source} -> ${item.targetOwner} (${item.specifier})`,
    ),
    '',
    'Deep frontend import examples:',
    ...metrics.relativeBoundaryImports.frontend.deepExamples.map(
      (item) => `  ${item.source} -> ${item.targetOwner} (${item.specifier})`,
    ),
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}
