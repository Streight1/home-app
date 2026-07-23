import { FolderTree } from './FolderTree.js';
import { Sheet } from '../../../../components/ui/Sheet/Sheet.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import type { DocumentFolderNode } from '../../types/document.types.js';
import { Folder } from 'lucide-react';

export function MobileFolderSheet(
  props: Omit<Parameters<typeof FolderTree>[0], 'folders'> & {
    folders: readonly DocumentFolderNode[];
    currentName: string;
  },
) {
  return (
    <div className="md:hidden">
      <Sheet
        side="bottom"
        title="Složky dokumentů"
        trigger={
          <Button>
            <Folder className="size-4" aria-hidden="true" />
            {props.currentName}
          </Button>
        }
      >
        <FolderTree
          folders={props.folders}
          selectedId={props.selectedId}
          canMutate={props.canMutate}
          onSelect={props.onSelect}
          onRename={props.onRename}
          onMove={props.onMove}
          onDelete={props.onDelete}
        />
      </Sheet>
    </div>
  );
}
