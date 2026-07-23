import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import {
  access,
  link,
  mkdir,
  readdir,
  realpath,
  rmdir,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { dirname, isAbsolute, posix, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform, type Readable, type TransformCallback } from 'node:stream';
import {
  HttpStatus,
  Inject,
  Injectable,
  type OnModuleInit,
} from '@nestjs/common';
import { ApiException } from '../../common/errors/api-exception.js';
import { AppConfigService } from '../../config/app-config.service.js';
import type { StoragePort, StorageWriteOptions } from './storage.port.js';
import type { StoredFile, StoredFileMetadata } from './stored-file.js';

const storageKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const directorySegmentPattern = /^(?:[a-z][a-z0-9-]{0,49}|[0-9a-f-]{36})$/i;

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

class ByteLimitTransform extends Transform {
  public bytes = 0;

  public constructor(private readonly limit: number) {
    super();
  }

  public override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.bytes += chunk.length;
    if (this.bytes > this.limit) {
      callback(
        new ApiException(
          HttpStatus.PAYLOAD_TOO_LARGE,
          'STORAGE_FILE_TOO_LARGE',
          'Soubor je příliš velký.',
        ),
      );
      return;
    }
    callback(null, chunk);
  }
}

@Injectable()
export class LocalFileStorageService implements StoragePort, OnModuleInit {
  private canonicalRoot = '';

  public constructor(
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public async onModuleInit(): Promise<void> {
    try {
      await mkdir(this.config.uploadRoot, { recursive: true, mode: 0o700 });
      await access(this.config.uploadRoot, constants.W_OK);
      this.canonicalRoot = await realpath(this.config.uploadRoot);
    } catch {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'STORAGE_UNAVAILABLE',
        'Úložiště souborů není zapisovatelné.',
      );
    }
  }

  public async write(
    source: Buffer | Readable,
    options: StorageWriteOptions = {},
  ): Promise<StoredFile> {
    const filename = randomUUID();
    const directorySegments = options.directorySegments ?? [];
    this.assertDirectorySegments(directorySegments);
    const storageKey = posix.join(...directorySegments, filename);
    const canonicalDirectory = await this.prepareDirectory(directorySegments);
    const finalPath = resolve(canonicalDirectory, filename);
    const temporaryPath = resolve(canonicalDirectory, `${filename}.uploading`);
    let linked = false;
    try {
      const size = Buffer.isBuffer(source)
        ? await this.writeBuffer(temporaryPath, source)
        : await this.writeStream(temporaryPath, source);
      await link(temporaryPath, finalPath);
      linked = true;
      await unlink(temporaryPath);
      return { storageKey, size };
    } catch (error) {
      await unlink(temporaryPath).catch(() => undefined);
      if (linked) await unlink(finalPath).catch(() => undefined);
      throw error;
    }
  }

  public async read(storageKey: string): Promise<Readable> {
    const path = await this.resolveExistingStorageKey(storageKey);
    await access(path, constants.R_OK);
    return createReadStream(path);
  }

  public async exists(storageKey: string): Promise<boolean> {
    try {
      await access(
        await this.resolveExistingStorageKey(storageKey),
        constants.F_OK,
      );
      return true;
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') return false;
      throw error;
    }
  }

  public async getMetadata(
    storageKey: string,
  ): Promise<StoredFileMetadata | null> {
    try {
      const file = await stat(await this.resolveExistingStorageKey(storageKey));
      return { storageKey, size: file.size, createdAt: file.birthtime };
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') return null;
      throw error;
    }
  }

  public async delete(storageKey: string): Promise<void> {
    try {
      const path = await this.resolveExistingStorageKey(storageKey);
      await unlink(path);
      await this.removeEmptyParents(dirname(path));
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'ENOENT') throw error;
    }
  }

  private async writeBuffer(path: string, source: Buffer): Promise<number> {
    if (source.length > this.config.maxUploadBytes) {
      throw new ApiException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        'STORAGE_FILE_TOO_LARGE',
        'Soubor je příliš velký.',
      );
    }
    await writeFile(path, source, { flag: 'wx', mode: 0o600 });
    return source.length;
  }

  private async writeStream(path: string, source: Readable): Promise<number> {
    const limiter = new ByteLimitTransform(this.config.maxUploadBytes);
    await pipeline(
      source,
      limiter,
      createWriteStream(path, { flags: 'wx', mode: 0o600 }),
    );
    return limiter.bytes;
  }

  private validateStorageKey(storageKey: string): string {
    const segments = storageKey.split('/');
    const filename = segments.at(-1) ?? '';
    const directories = segments.slice(0, -1);
    if (
      isAbsolute(storageKey) ||
      storageKey.includes('\\') ||
      storageKey.includes('..') ||
      segments.some((segment) => segment.length === 0) ||
      !storageKeyPattern.test(filename)
    ) {
      this.rejectInvalidKey();
    }
    this.assertDirectorySegments(directories);
    return this.assertInsideRoot(resolve(this.config.uploadRoot, ...segments));
  }

  private async resolveExistingStorageKey(storageKey: string): Promise<string> {
    const requestedPath = this.validateStorageKey(storageKey);
    const canonicalPath = await realpath(requestedPath);
    this.assertInsideCanonicalRoot(canonicalPath);
    return canonicalPath;
  }

  private async prepareDirectory(segments: readonly string[]): Promise<string> {
    let current = this.canonicalRoot;
    for (const segment of segments) {
      const next = resolve(current, segment);
      this.assertInsideCanonicalRoot(next);
      try {
        await mkdir(next, { mode: 0o700 });
      } catch (error) {
        if (!isNodeError(error) || error.code !== 'EEXIST') throw error;
      }
      current = await realpath(next);
      this.assertInsideCanonicalRoot(current);
      if (!(await stat(current)).isDirectory()) this.rejectInvalidKey();
    }
    return current;
  }

  private assertDirectorySegments(segments: readonly string[]): void {
    if (
      segments.length > 6 ||
      segments.some(
        (segment) =>
          segment === '.' ||
          segment === '..' ||
          isAbsolute(segment) ||
          !directorySegmentPattern.test(segment),
      )
    ) {
      this.rejectInvalidKey();
    }
  }

  private assertInsideRoot(path: string): string {
    const rootPrefix = `${resolve(this.config.uploadRoot)}${sep}`;
    if (
      path !== resolve(this.config.uploadRoot) &&
      !path.startsWith(rootPrefix)
    )
      this.rejectInvalidKey();
    return path;
  }

  private assertInsideCanonicalRoot(path: string): void {
    const rootPrefix = `${this.canonicalRoot}${sep}`;
    if (path !== this.canonicalRoot && !path.startsWith(rootPrefix))
      this.rejectInvalidKey();
  }

  private async removeEmptyParents(path: string): Promise<void> {
    let current = path;
    while (current !== this.canonicalRoot) {
      try {
        const entries = await readdir(current);
        if (entries.length > 0) return;
        await rmdir(current);
        current = dirname(current);
      } catch {
        return;
      }
    }
  }

  private rejectInvalidKey(): never {
    throw new ApiException(
      HttpStatus.BAD_REQUEST,
      'STORAGE_INVALID_KEY',
      'Identifikátor souboru není platný.',
    );
  }
}
