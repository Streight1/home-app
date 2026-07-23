import { Global, Module } from '@nestjs/common';
import { LocalFileStorageService } from './local-file-storage.service.js';
import { STORAGE_PORT } from './storage.port.js';

@Global()
@Module({
  providers: [
    LocalFileStorageService,
    { provide: STORAGE_PORT, useExisting: LocalFileStorageService },
  ],
  exports: [LocalFileStorageService, STORAGE_PORT],
})
export class StorageModule {}
