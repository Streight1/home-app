export const TEMPORARY_IMPORT_FILE_PORT = Symbol('TEMPORARY_IMPORT_FILE_PORT');

export interface TemporaryImportFilePort {
  write(
    householdId: string,
    sessionId: string,
    content: Buffer,
  ): Promise<string>;
  read(storageKey: string, maxBytes: number): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}
