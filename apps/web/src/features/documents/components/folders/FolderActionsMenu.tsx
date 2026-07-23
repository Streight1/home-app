import { FolderInput, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import {
  DropdownMenu,
  DropdownMenuItem,
} from '../../../../components/ui/DropdownMenu/DropdownMenu.js';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import type { DocumentFolderNode } from '../../types/document.types.js';
import { FolderPicker } from './FolderPicker.js';

function withoutFolder(
  folders: readonly DocumentFolderNode[],
  excludedId: string,
): DocumentFolderNode[] {
  return folders
    .filter((folder) => folder.id !== excludedId)
    .map((folder) => ({
      ...folder,
      children: withoutFolder(folder.children, excludedId),
    }));
}

export function FolderActionsMenu({
  folderId,
  name,
  folders,
  onRename,
  onMove,
  onDelete,
}: {
  folderId: string;
  name: string;
  folders: readonly DocumentFolderNode[];
  onRename: (name: string) => void;
  onMove: (parentId: string | null) => void;
  onDelete: () => void;
}) {
  const [dialog, setDialog] = useState<'rename' | 'move' | 'delete' | null>(
    null,
  );
  const [nextName, setNextName] = useState(name);
  const [parentId, setParentId] = useState('root');
  return (
    <>
      <DropdownMenu
        label={`Akce složky ${name}`}
        trigger={
          <IconButton aria-label={`Akce složky ${name}`} variant="ghost">
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </IconButton>
        }
      >
        <DropdownMenuItem onSelect={() => setDialog('rename')}>
          <Pencil className="size-4" aria-hidden="true" />
          Přejmenovat
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setDialog('move')}>
          <FolderInput className="size-4" aria-hidden="true" />
          Přesunout
        </DropdownMenuItem>
        <DropdownMenuItem danger onSelect={() => setDialog('delete')}>
          <Trash2 className="size-4" aria-hidden="true" />
          Odstranit prázdnou složku
        </DropdownMenuItem>
      </DropdownMenu>
      <Dialog
        open={dialog === 'rename'}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title="Přejmenovat složku"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onRename(nextName);
            setDialog(null);
          }}
        >
          <Input
            label="Název složky"
            value={nextName}
            maxLength={100}
            onChange={(event) => setNextName(event.target.value)}
          />
          <Button type="submit" variant="primary">
            Uložit název
          </Button>
        </form>
      </Dialog>
      <Dialog
        open={dialog === 'move'}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title="Přesunout složku"
        description="Vyberte nové nadřazené umístění. Přesun do vlastního potomka server odmítne."
      >
        <div className="grid gap-4">
          <FolderPicker
            folders={withoutFolder(folders, folderId)}
            value={parentId}
            label="Nové umístění"
            onChange={setParentId}
          />
          <Button
            variant="primary"
            onClick={() => {
              onMove(parentId === 'root' ? null : parentId);
              setDialog(null);
            }}
          >
            Přesunout složku
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={dialog === 'delete'}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        title="Odstranit složku"
        description="Odstranit lze pouze složku bez dokumentů a podsložek."
      >
        <div className="flex justify-end gap-3">
          <Button onClick={() => setDialog(null)}>Zrušit</Button>
          <Button
            variant="danger"
            onClick={() => {
              onDelete();
              setDialog(null);
            }}
          >
            Odstranit
          </Button>
        </div>
      </Dialog>
    </>
  );
}
