import type { DocumentFolderNode } from '../../types/document.types.js';
export interface FolderOption {
  id: string;
  label: string;
  depth: number;
}
export function flattenFolders(
  folders: readonly DocumentFolderNode[],
  depth = 0,
): FolderOption[] {
  return folders.flatMap((folder) => [
    { id: folder.id, label: folder.name, depth },
    ...flattenFolders(folder.children, depth + 1),
  ]);
}
