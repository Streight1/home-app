import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import {
  useCreateFolder,
  useDocumentFolders,
} from '../../hooks/useDocumentFolders.js';
import { useMoveDocument } from '../../hooks/useMoveDocument.js';
import { documentErrorMessage } from '../../lib/documentErrorMessage.js';
import type { DocumentListItem } from '../../types/document.types.js';
import { FolderCreateDialog } from '../folders/FolderCreateDialog.js';
import { FolderPicker } from '../folders/FolderPicker.js';

export function DocumentMoveDialog({
  document,
  open,
  onOpenChange,
}: {
  document: DocumentListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const folders = useDocumentFolders();
  const move = useMoveDocument(document?.id ?? '');
  const create = useCreateFolder();
  const [folderId, setFolderId] = useState('root');
  useEffect(() => setFolderId(document?.folder?.id ?? 'root'), [document]);
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Přesunout dokument"
      description={
        document?.presentation.primaryLabel ?? 'Vyberte cílovou složku.'
      }
      size="md"
      mobileFullScreen
    >
      {folders.error || move.error ? (
        <InlineAlert variant="danger">
          {documentErrorMessage(folders.error ?? move.error)}
        </InlineAlert>
      ) : null}
      <div className="grid gap-4">
        <FolderPicker
          folders={folders.data?.items ?? []}
          value={folderId}
          onChange={setFolderId}
          label="Cílová složka"
        />
        <div className="flex flex-wrap gap-3">
          <FolderCreateDialog
            parentId={folderId === 'root' ? null : folderId}
            pending={create.isPending}
            error={create.error}
            onCreate={(input) => create.mutate(input)}
          />
          <Button
            variant="primary"
            loading={move.isPending}
            disabled={folderId === (document?.folder?.id ?? 'root')}
            onClick={() =>
              move.mutate(folderId === 'root' ? null : folderId, {
                onSuccess: () => onOpenChange(false),
              })
            }
          >
            Přesunout
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
