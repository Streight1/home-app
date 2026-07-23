import { Inject, Injectable } from '@nestjs/common';
import { type Readable } from 'node:stream';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../../infrastructure/storage/storage.port.js';
import { financeImportInvalid } from '../domain/finance-import.errors.js';
import type { TemporaryImportFilePort } from '../domain/ports/temporary-import-file.port.js';

@Injectable()
export class StorageTemporaryImportFileAdapter implements TemporaryImportFilePort {
  public constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  public async write(
    householdId: string,
    sessionId: string,
    content: Buffer,
  ): Promise<string> {
    const stored = await this.storage.write(content, {
      directorySegments: [
        'finance-imports',
        'temporary',
        householdId,
        sessionId,
      ],
    });
    return stored.storageKey;
  }

  public async read(storageKey: string, maxBytes: number): Promise<Buffer> {
    const metadata = await this.storage.getMetadata(storageKey);
    if (!metadata || metadata.size > maxBytes)
      throw financeImportInvalid('Dočasný CSV soubor není dostupný.');
    return collect(await this.storage.read(storageKey), maxBytes);
  }

  public delete(storageKey: string): Promise<void> {
    return this.storage.delete(storageKey);
  }
}

async function collect(source: Readable, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of source) {
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk as Uint8Array);
    size += buffer.length;
    if (size > maxBytes)
      throw financeImportInvalid('CSV soubor překročil povolený limit.');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}
