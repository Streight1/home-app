import { mkdtemp, readdir, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AppConfigService } from '../src/config/app-config.service.js';
import { LocalFileStorageService } from '../src/infrastructure/storage/local-file-storage.service.js';

describe('LocalFileStorageService', () => {
  let root: string;
  let storage: LocalFileStorageService;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'life-admin-storage-'));
    storage = new LocalFileStorageService({
      uploadRoot: root,
      maxUploadBytes: 1024,
    } as AppConfigService);
    await storage.onModuleInit();
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('creates a file under the upload root with a server-generated UUID name', async () => {
    const stored = await storage.write(Buffer.from('private content'));
    expect(stored.storageKey).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await readFile(join(root, stored.storageKey), 'utf8')).toBe(
      'private content',
    );
    expect(await storage.exists(stored.storageKey)).toBe(true);
  });

  it('creates a nested server-owned document key', async () => {
    const householdId = '10000000-0000-4000-8000-000000000001';
    const documentId = '20000000-0000-4000-8000-000000000002';
    const stored = await storage.write(Buffer.from('private content'), {
      directorySegments: ['documents', householdId, documentId],
    });
    expect(stored.storageKey).toMatch(
      new RegExp(`^documents/${householdId}/${documentId}/[0-9a-f-]{36}$`, 'i'),
    );
    expect(await storage.exists(stored.storageKey)).toBe(true);
  });

  it.each(['../outside', '/tmp/outside'])(
    'rejects unsafe storage key %s',
    async (storageKey) => {
      await expect(storage.read(storageKey)).rejects.toMatchObject({
        code: 'STORAGE_INVALID_KEY',
      });
    },
  );

  it.each([['documents', '..'], ['/tmp']])(
    'rejects unsafe directory segments %s',
    async (...directorySegments) => {
      await expect(
        storage.write(Buffer.from('private'), { directorySegments }),
      ).rejects.toMatchObject({ code: 'STORAGE_INVALID_KEY' });
    },
  );

  it('rejects a symlink that escapes the upload root', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'life-admin-outside-'));
    try {
      await symlink(outside, join(root, 'documents'));
      await expect(
        storage.write(Buffer.from('private'), {
          directorySegments: [
            'documents',
            '10000000-0000-4000-8000-000000000001',
          ],
        }),
      ).rejects.toMatchObject({ code: 'STORAGE_INVALID_KEY' });
      expect(await readdir(outside)).toEqual([]);
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('removes the temporary file when a stream fails', async () => {
    const failingStream = Readable.from(
      (async function* () {
        yield Buffer.from('partial');
        await Promise.resolve();
        throw new Error('stream failed');
      })(),
    );
    await expect(storage.write(failingStream)).rejects.toThrow('stream failed');
    expect(
      (await readdir(root)).filter((name) => name.endsWith('.uploading')),
    ).toEqual([]);
  });
});
