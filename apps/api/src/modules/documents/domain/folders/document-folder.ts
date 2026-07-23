export interface DocumentFolderRecord {
  id: string;
  householdId: string;
  parentId: string | null;
  name: string;
  normalizedName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children: DocumentFolderNode[];
}

export function normalizeFolderName(name: string): string {
  return name
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('cs-CZ');
}
