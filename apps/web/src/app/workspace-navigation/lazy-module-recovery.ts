import {
  clearLazyChunkReloadAttempt,
  markLazyChunkReloadAttempted,
  readLazyChunkReloadTarget,
} from './workspace-storage.js';

export interface LazyChunkRecoveryDependencies {
  readReloadTarget: () => string | null | undefined;
  markReloadAttempted: (target: string) => boolean;
  clearReloadAttempt: (target: string) => void;
  reload: () => void;
}

const browserDependencies: LazyChunkRecoveryDependencies = {
  readReloadTarget: readLazyChunkReloadTarget,
  markReloadAttempted: markLazyChunkReloadAttempted,
  clearReloadAttempt: clearLazyChunkReloadAttempt,
  reload: () => window.location.reload(),
};

export function isStaleDynamicImportError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === 'ChunkLoadError') return true;
  return [
    'failed to fetch dynamically imported module',
    'error loading dynamically imported module',
    'importing a module script failed',
    'unable to preload css',
  ].some((message) => error.message.toLowerCase().includes(message));
}

export function requestLazyChunkReload(
  target: string,
  error: unknown,
  dependencies: LazyChunkRecoveryDependencies = browserDependencies,
): boolean {
  if (!isStaleDynamicImportError(error)) return false;
  const attemptedTarget = dependencies.readReloadTarget();
  if (attemptedTarget === undefined || attemptedTarget !== null) return false;
  if (!dependencies.markReloadAttempted(target)) return false;
  dependencies.reload();
  return true;
}

export async function loadLazyModuleWithRecovery<T>(
  target: string,
  loader: () => Promise<T>,
  dependencies: LazyChunkRecoveryDependencies = browserDependencies,
): Promise<T> {
  try {
    const module = await loader();
    dependencies.clearReloadAttempt(target);
    return module;
  } catch (error) {
    if (!requestLazyChunkReload(target, error, dependencies)) throw error;
    return new Promise<T>(() => undefined);
  }
}
