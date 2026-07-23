import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { useArchiveDocument } from '../../hooks/useArchiveDocument.js';
import {
  usePermanentlyDeleteDocument,
  useRestoreDocumentFromTrash,
  useTrashDocument,
} from '../../hooks/useDocumentLifecycle.js';
import { useRestoreDocument } from '../../hooks/useRestoreDocument.js';
import { documentErrorMessage } from '../../lib/documentErrorMessage.js';
import type { DocumentListItem } from '../../types/document.types.js';

export type DocumentLifecycleAction =
  | 'archive'
  | 'restore-archive'
  | 'trash'
  | 'restore-trash'
  | 'delete';

const copy: Record<
  DocumentLifecycleAction,
  { title: string; description: string; button: string; danger: boolean }
> = {
  archive: {
    title: 'Archivovat dokument?',
    description: 'Dokument zůstane uložený a můžete jej kdykoli obnovit.',
    button: 'Archivovat',
    danger: false,
  },
  'restore-archive': {
    title: 'Obnovit z archivu?',
    description: 'Dokument se vrátí mezi aktivní dokumenty.',
    button: 'Obnovit',
    danger: false,
  },
  trash: {
    title: 'Přesunout dokument do koše?',
    description: 'Soubor se nyní fyzicky nemaže a dokument lze z koše obnovit.',
    button: 'Přesunout do koše',
    danger: true,
  },
  'restore-trash': {
    title: 'Obnovit dokument z koše?',
    description:
      'Vrátí se do původní složky, pokud stále existuje, jinak do kořene.',
    button: 'Obnovit z koše',
    danger: false,
  },
  delete: {
    title: 'Trvale odstranit dokument?',
    description:
      'Dokument i uložený soubor budou odstraněny bez možnosti obnovení. Archivace je bezpečnější alternativa.',
    button: 'Trvale odstranit',
    danger: true,
  },
};

export function DocumentLifecycleDialog({
  document,
  action,
  onClose,
}: {
  document: DocumentListItem | null;
  action: DocumentLifecycleAction | null;
  onClose: () => void;
}) {
  const archive = useArchiveDocument();
  const restoreArchive = useRestoreDocument();
  const trash = useTrashDocument();
  const restoreTrash = useRestoreDocumentFromTrash();
  const permanent = usePermanentlyDeleteDocument();
  const [confirmation, setConfirmation] = useState('');
  useEffect(() => setConfirmation(''), [action, document]);
  if (!action) return null;
  const configuration = copy[action];
  const mutation =
    action === 'archive'
      ? archive
      : action === 'restore-archive'
        ? restoreArchive
        : action === 'trash'
          ? trash
          : action === 'restore-trash'
            ? restoreTrash
            : permanent;
  const run = () => {
    if (!document || (action === 'delete' && confirmation !== 'SMAZAT')) return;
    mutation.mutate(document.id, { onSuccess: onClose });
  };
  return (
    <Dialog
      open={Boolean(document)}
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
      title={configuration.title}
      description={configuration.description}
      size="sm"
    >
      <p className="break-words font-semibold text-text">
        {document?.presentation.primaryLabel}
      </p>
      {action === 'delete' ? (
        <div className="mt-4">
          <Input
            label="Pro potvrzení napište SMAZAT"
            value={confirmation}
            autoComplete="off"
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>
      ) : null}
      {mutation.error ? (
        <div className="mt-4">
          <InlineAlert variant="danger">
            {documentErrorMessage(mutation.error)}
          </InlineAlert>
        </div>
      ) : null}
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button disabled={mutation.isPending} onClick={onClose}>
          Zrušit
        </Button>
        <Button
          variant={configuration.danger ? 'danger' : 'primary'}
          loading={mutation.isPending}
          disabled={action === 'delete' && confirmation !== 'SMAZAT'}
          onClick={run}
        >
          {configuration.button}
        </Button>
      </div>
    </Dialog>
  );
}
