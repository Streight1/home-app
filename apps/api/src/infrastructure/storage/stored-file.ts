export interface StoredFile {
  storageKey: string;
  size: number;
}

export interface StoredFileMetadata extends StoredFile {
  createdAt: Date;
}
