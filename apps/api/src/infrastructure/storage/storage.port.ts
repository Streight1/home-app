import type { Readable } from 'node:stream';
import type { StoredFile, StoredFileMetadata } from './stored-file.js';

export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StorageWriteOptions {
  directorySegments?: readonly string[];
}

export interface StoragePort {
  write(
    source: Buffer | Readable,
    options?: StorageWriteOptions,
  ): Promise<StoredFile>;
  read(storageKey: string): Promise<Readable>;
  exists(storageKey: string): Promise<boolean>;
  getMetadata(storageKey: string): Promise<StoredFileMetadata | null>;
  delete(storageKey: string): Promise<void>;
}
