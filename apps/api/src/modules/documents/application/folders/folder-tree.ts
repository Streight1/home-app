import { invalidFolder } from '../../domain/folders/document-folder.errors.js';
import type {
  DocumentFolderNode,
  DocumentFolderRecord,
} from '../../domain/folders/document-folder.js';

export const maximumFolderDepth = 10;

export function folderDepth(
  folders: readonly DocumentFolderRecord[],
  folderId: string | null,
): number {
  let depth = 0;
  let current = folderId;
  const visited = new Set<string>();
  while (current) {
    if (visited.has(current))
      throw invalidFolder('Struktura složek obsahuje cyklus.');
    visited.add(current);
    const folder = folders.find((item) => item.id === current);
    if (!folder) throw invalidFolder('Nadřazená složka nebyla nalezena.');
    depth += 1;
    current = folder.parentId;
  }
  return depth;
}

export function descendantIds(
  folders: readonly DocumentFolderRecord[],
  folderId: string,
): Set<string> {
  const result = new Set<string>();
  const queue = [folderId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    for (const child of folders.filter(
      (folder) => folder.parentId === current,
    )) {
      if (result.has(child.id))
        throw invalidFolder('Struktura složek obsahuje cyklus.');
      result.add(child.id);
      queue.push(child.id);
    }
  }
  return result;
}

export function buildFolderTree(
  folders: readonly DocumentFolderRecord[],
): DocumentFolderNode[] {
  const childrenByParent = new Map<string | null, DocumentFolderRecord[]>();
  for (const folder of folders) {
    const siblings = childrenByParent.get(folder.parentId) ?? [];
    siblings.push(folder);
    childrenByParent.set(folder.parentId, siblings);
  }
  const build = (
    parentId: string | null,
    path: Set<string>,
  ): DocumentFolderNode[] =>
    (childrenByParent.get(parentId) ?? []).map((folder) => {
      if (path.has(folder.id))
        throw invalidFolder('Struktura složek obsahuje cyklus.');
      return {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        children: build(folder.id, new Set([...path, folder.id])),
      };
    });
  return build(null, new Set());
}
