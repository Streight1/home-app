import { FolderCreateDialog } from './FolderCreateDialog.js';
import { FolderTree } from './FolderTree.js';
import { MobileFolderSheet } from './MobileFolderSheet.js';
import type { DocumentFolderNode } from '../../types/document.types.js';

interface DocumentFolderNavigationProps {
  folders: readonly DocumentFolderNode[];
  selectedId: string | null;
  currentName: string;
  canMutate: boolean;
  includeSubfolders: boolean;
  creating: boolean;
  createError: unknown;
  onSelect: (id: string | null) => void;
  onCreate: (input: { name: string; parentId: string | null }) => void;
  onRename: (id: string, name: string) => void;
  onMove: (id: string, parentId: string | null) => void;
  onDelete: (id: string) => void;
  onIncludeSubfolders: (include: boolean) => void;
}

export function DocumentFolderNavigation({
  folders,
  selectedId,
  currentName,
  canMutate,
  includeSubfolders,
  creating,
  createError,
  onSelect,
  onCreate,
  onRename,
  onMove,
  onDelete,
  onIncludeSubfolders,
}: DocumentFolderNavigationProps) {
  const parentId = selectedId && selectedId !== 'root' ? selectedId : null;
  const tree = (
    <FolderTree
      folders={folders}
      selectedId={selectedId}
      canMutate={canMutate}
      onSelect={onSelect}
      onRename={onRename}
      onMove={onMove}
      onDelete={onDelete}
    />
  );
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
        <MobileFolderSheet
          folders={folders}
          currentName={currentName}
          selectedId={selectedId}
          canMutate={canMutate}
          onSelect={onSelect}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
        />
        {canMutate ? (
          <FolderCreateDialog
            parentId={parentId}
            onCreate={onCreate}
            pending={creating}
            error={createError}
          />
        ) : null}
      </div>
      <aside className="hidden h-fit rounded-lg border border-border bg-surface-raised p-3 md:block">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-body-sm font-semibold text-text">Složky</h2>
          {canMutate ? (
            <FolderCreateDialog
              parentId={parentId}
              onCreate={onCreate}
              pending={creating}
              error={createError}
            />
          ) : null}
        </div>
        {tree}
        {selectedId && selectedId !== 'root' ? (
          <label className="mt-3 flex min-h-11 items-center gap-2 border-t border-border pt-3 text-caption text-text-muted">
            <input
              type="checkbox"
              checked={includeSubfolders}
              onChange={(event) => onIncludeSubfolders(event.target.checked)}
            />
            Včetně podsložek
          </label>
        ) : null}
      </aside>
    </>
  );
}
