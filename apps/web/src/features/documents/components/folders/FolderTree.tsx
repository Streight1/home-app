import { Folder, FolderOpen } from 'lucide-react';
import type { DocumentFolderNode } from '../../types/document.types.js';
import { FolderActionsMenu } from './FolderActionsMenu.js';

interface FolderTreeProps {
  folders: readonly DocumentFolderNode[];
  selectedId: string | null;
  canMutate: boolean;
  onSelect: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  onMove: (id: string, parentId: string | null) => void;
  onDelete: (id: string) => void;
}
export function FolderTree({
  folders,
  selectedId,
  canMutate,
  onSelect,
  onRename,
  onMove,
  onDelete,
}: FolderTreeProps) {
  const render = (items: readonly DocumentFolderNode[], depth: number) =>
    items.map((folder) => (
      <li key={folder.id}>
        <div
          className="flex items-center gap-1"
          style={{ paddingInlineStart: `${String(depth * 12)}px` }}
        >
          <button
            type="button"
            aria-current={selectedId === folder.id ? 'page' : undefined}
            onClick={() => onSelect(folder.id)}
            className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-body-sm focus-visible:outline-2 focus-visible:outline-focus ${selectedId === folder.id ? 'bg-selected text-primary-emphasis' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`}
          >
            {selectedId === folder.id ? (
              <FolderOpen className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Folder className="size-4 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">{folder.name}</span>
          </button>
          {canMutate ? (
            <FolderActionsMenu
              folderId={folder.id}
              name={folder.name}
              folders={folders}
              onRename={(name) => onRename(folder.id, name)}
              onMove={(parentId) => onMove(folder.id, parentId)}
              onDelete={() => onDelete(folder.id)}
            />
          ) : null}
        </div>
        {folder.children.length > 0 ? (
          <ul>{render(folder.children, depth + 1)}</ul>
        ) : null}
      </li>
    ));
  const rootClass = (active: boolean) =>
    `flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-left text-body-sm focus-visible:outline-2 focus-visible:outline-focus ${active ? 'bg-selected text-primary-emphasis' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`;
  return (
    <nav aria-label="Složky dokumentů">
      <button
        type="button"
        aria-current={selectedId === null ? 'page' : undefined}
        onClick={() => onSelect(null)}
        className={rootClass(selectedId === null)}
      >
        <FolderOpen className="size-4" aria-hidden="true" />
        Všechny dokumenty
      </button>
      <button
        type="button"
        aria-current={selectedId === 'root' ? 'page' : undefined}
        onClick={() => onSelect('root')}
        className={rootClass(selectedId === 'root')}
      >
        <Folder className="size-4" aria-hidden="true" />
        Kořen knihovny
      </button>
      <ul className="mt-1">{render(folders, 0)}</ul>
    </nav>
  );
}
