import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isStaleDynamicImportError,
  loadLazyModuleWithRecovery,
  type LazyChunkRecoveryDependencies,
} from './lazy-module-recovery.js';

function createDependencies({
  attemptedTarget = null,
}: {
  attemptedTarget?: string | null | undefined;
} = {}) {
  let storedTarget = attemptedTarget;
  const reloadSignal = new Error('reload scheduled');
  const dependencies: LazyChunkRecoveryDependencies = {
    readReloadTarget: () => storedTarget,
    markReloadAttempted: vi.fn((target: string) => {
      storedTarget = target;
      return true;
    }),
    clearReloadAttempt: vi.fn((target: string) => {
      if (storedTarget === target) storedTarget = null;
    }),
    reload: vi.fn(() => {
      throw reloadSignal;
    }),
  };
  return { dependencies, reloadSignal };
}

describe('lazy module recovery', () => {
  beforeEach(() => window.history.replaceState({}, '', '/app'));

  it('recognizes browser and bundler dynamic import failures only', () => {
    expect(
      isStaleDynamicImportError(
        new TypeError(
          'Failed to fetch dynamically imported module: /assets/calendar.js',
        ),
      ),
    ).toBe(true);
    expect(
      isStaleDynamicImportError(
        Object.assign(new Error('Loading chunk failed'), {
          name: 'ChunkLoadError',
        }),
      ),
    ).toBe(true);
    expect(isStaleDynamicImportError(new Error('Render failed'))).toBe(false);
  });

  it('reloads the current /app page once after a stale chunk rejection', async () => {
    const { dependencies, reloadSignal } = createDependencies();
    const staleChunk = new TypeError(
      'Failed to fetch dynamically imported module: /assets/tasks.js',
    );

    await expect(
      loadLazyModuleWithRecovery(
        'workspace-tasks',
        () => Promise.reject(staleChunk),
        dependencies,
      ),
    ).rejects.toBe(reloadSignal);

    expect(dependencies.markReloadAttempted).toHaveBeenCalledWith(
      'workspace-tasks',
    );
    expect(dependencies.reload).toHaveBeenCalledOnce();
    expect(window.location.pathname).toBe('/app');
  });

  it('does not loop when another lazy chunk fails in the same browser session', async () => {
    const { dependencies } = createDependencies({
      attemptedTarget: 'workspace-tasks',
    });
    const staleChunk = new TypeError(
      'Importing a module script failed while loading /assets/tasks.js',
    );

    await expect(
      loadLazyModuleWithRecovery(
        'workspace-tasks',
        () => Promise.reject(staleChunk),
        dependencies,
      ),
    ).rejects.toBe(staleChunk);

    expect(dependencies.markReloadAttempted).not.toHaveBeenCalled();
    expect(dependencies.reload).not.toHaveBeenCalled();
  });

  it('clears recovery only after the same lazy target loads successfully', async () => {
    const { dependencies } = createDependencies({
      attemptedTarget: 'workspace-tasks',
    });
    const loadedModule = { default: 'workspace' };

    await expect(
      loadLazyModuleWithRecovery(
        'workspace-tasks',
        () => Promise.resolve(loadedModule),
        dependencies,
      ),
    ).resolves.toBe(loadedModule);

    expect(dependencies.clearReloadAttempt).toHaveBeenCalledWith(
      'workspace-tasks',
    );
    expect(dependencies.readReloadTarget()).toBeNull();
  });

  it('keeps a failed overlay guarded when an unrelated workspace loads', async () => {
    const { dependencies, reloadSignal } = createDependencies();
    const staleOverlay = new TypeError(
      'Failed to fetch dynamically imported module: /assets/trip-dialog.js',
    );

    await expect(
      loadLazyModuleWithRecovery(
        'overlay-trip-dialog',
        () => Promise.reject(staleOverlay),
        dependencies,
      ),
    ).rejects.toBe(reloadSignal);
    await expect(
      loadLazyModuleWithRecovery(
        'workspace-dashboard',
        () => Promise.resolve({ default: 'dashboard' }),
        dependencies,
      ),
    ).resolves.toEqual({ default: 'dashboard' });
    await expect(
      loadLazyModuleWithRecovery(
        'overlay-trip-dialog',
        () => Promise.reject(staleOverlay),
        dependencies,
      ),
    ).rejects.toBe(staleOverlay);

    expect(dependencies.clearReloadAttempt).toHaveBeenCalledWith(
      'workspace-dashboard',
    );
    expect(dependencies.readReloadTarget()).toBe('overlay-trip-dialog');
    expect(dependencies.reload).toHaveBeenCalledTimes(1);
  });

  it('keeps ordinary module errors on the existing error-boundary path', async () => {
    const { dependencies } = createDependencies();
    const moduleError = new Error('Named export is missing');

    await expect(
      loadLazyModuleWithRecovery(
        'workspace-tasks',
        () => Promise.reject(moduleError),
        dependencies,
      ),
    ).rejects.toBe(moduleError);

    expect(dependencies.markReloadAttempted).not.toHaveBeenCalled();
    expect(dependencies.reload).not.toHaveBeenCalled();
  });
});
