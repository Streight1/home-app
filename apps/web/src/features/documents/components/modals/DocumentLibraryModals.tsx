import type { Dispatch, SetStateAction } from 'react';
import type { DocumentListItem } from '../../types/document.types.js';
import { DocumentEditDialog } from './DocumentEditDialog.js';
import {
  DocumentLifecycleDialog,
  type DocumentLifecycleAction,
} from './DocumentLifecycleDialog.js';
import { DocumentMoveDialog } from './DocumentMoveDialog.js';
import { DocumentPreviewDialog } from './DocumentPreviewDialog.js';

export type DocumentLibraryModalState =
  | { type: 'preview' | 'edit' | 'move'; document: DocumentListItem }
  | {
      type: 'lifecycle';
      document: DocumentListItem;
      action: DocumentLifecycleAction;
    }
  | null;

export function DocumentLibraryModals({
  modal,
  setModal,
}: {
  modal: DocumentLibraryModalState;
  setModal: Dispatch<SetStateAction<DocumentLibraryModalState>>;
}) {
  const close = () => setModal(null);
  return (
    <>
      <DocumentPreviewDialog
        documentId={modal?.type === 'preview' ? modal.document.id : null}
        open={modal?.type === 'preview'}
        onOpenChange={(open) => !open && close()}
      />
      <DocumentEditDialog
        documentId={modal?.type === 'edit' ? modal.document.id : null}
        open={modal?.type === 'edit'}
        onOpenChange={(open) => !open && close()}
      />
      <DocumentMoveDialog
        document={modal?.type === 'move' ? modal.document : null}
        open={modal?.type === 'move'}
        onOpenChange={(open) => !open && close()}
      />
      <DocumentLifecycleDialog
        document={modal?.type === 'lifecycle' ? modal.document : null}
        action={modal?.type === 'lifecycle' ? modal.action : null}
        onClose={close}
      />
    </>
  );
}
