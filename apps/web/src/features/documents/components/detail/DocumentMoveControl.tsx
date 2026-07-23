import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { FolderPicker } from '../folders/FolderPicker.js';
import type { DocumentFolderNode } from '../../types/document.types.js';

export function DocumentMoveControl({
  folders,
  currentFolderId,
  pending,
  onMove,
}: {
  folders: readonly DocumentFolderNode[];
  currentFolderId: string | null;
  pending: boolean;
  onMove: (folderId: string | null) => void;
}) {
  const [folderId, setFolderId] = useState(currentFolderId ?? 'root');
  return (
    <div className="mt-5 border-t border-border pt-5">
      <FolderPicker folders={folders} value={folderId} onChange={setFolderId} />
      <Button
        className="mt-3 w-full"
        loading={pending}
        disabled={folderId === (currentFolderId ?? 'root')}
        onClick={() => onMove(folderId === 'root' ? null : folderId)}
      >
        Přesunout dokument
      </Button>
    </div>
  );
}
