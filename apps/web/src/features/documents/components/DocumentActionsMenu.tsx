import {
  Archive,
  FolderInput,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuItem,
} from '../../../components/ui/DropdownMenu/DropdownMenu.js';
import { IconButton } from '../../../components/ui/IconButton/IconButton.js';
import type { DocumentListItem } from '../types/document.types.js';
import type { DocumentLifecycleAction } from './modals/DocumentLifecycleDialog.js';

export function DocumentActionsMenu({
  document,
  busy = false,
  onEdit,
  onMove,
  onLifecycle,
}: {
  document: DocumentListItem;
  busy?: boolean;
  onEdit: () => void;
  onMove: () => void;
  onLifecycle: (action: DocumentLifecycleAction) => void;
}) {
  const permissions = document.permissions;
  const hasAction = Object.values(permissions).some(Boolean);
  if (!hasAction) return null;
  return (
    <DropdownMenu
      label={`Akce dokumentu ${document.presentation.primaryLabel}`}
      trigger={
        <IconButton
          aria-label={`Další akce: ${document.presentation.primaryLabel}`}
          variant="ghost"
          disabled={busy}
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
        </IconButton>
      }
    >
      {permissions.canEdit ? (
        <DropdownMenuItem onSelect={onEdit} disabled={busy}>
          <Pencil className="size-4" aria-hidden="true" /> Upravit údaje
        </DropdownMenuItem>
      ) : null}
      {permissions.canMove ? (
        <DropdownMenuItem onSelect={onMove} disabled={busy}>
          <FolderInput className="size-4" aria-hidden="true" /> Přesunout
        </DropdownMenuItem>
      ) : null}
      {permissions.canArchive ? (
        <DropdownMenuItem
          onSelect={() => onLifecycle('archive')}
          disabled={busy}
        >
          <Archive className="size-4" aria-hidden="true" /> Archivovat
        </DropdownMenuItem>
      ) : null}
      {permissions.canRestoreArchive ? (
        <DropdownMenuItem
          onSelect={() => onLifecycle('restore-archive')}
          disabled={busy}
        >
          <RotateCcw className="size-4" aria-hidden="true" /> Obnovit z archivu
        </DropdownMenuItem>
      ) : null}
      {permissions.canMoveToTrash ? (
        <DropdownMenuItem onSelect={() => onLifecycle('trash')} disabled={busy}>
          <Trash2 className="size-4" aria-hidden="true" /> Přesunout do koše
        </DropdownMenuItem>
      ) : null}
      {permissions.canRestoreFromTrash ? (
        <DropdownMenuItem
          onSelect={() => onLifecycle('restore-trash')}
          disabled={busy}
        >
          <RotateCcw className="size-4" aria-hidden="true" /> Obnovit z koše
        </DropdownMenuItem>
      ) : null}
      {permissions.canPermanentlyDelete ? (
        <DropdownMenuItem
          onSelect={() => onLifecycle('delete')}
          disabled={busy}
        >
          <Trash2 className="size-4" aria-hidden="true" /> Trvale odstranit
        </DropdownMenuItem>
      ) : null}
    </DropdownMenu>
  );
}
