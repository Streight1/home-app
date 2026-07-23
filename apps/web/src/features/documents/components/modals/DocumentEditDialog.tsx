import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../../components/ui/Spinner/Spinner.js';
import { useDocument } from '../../hooks/useDocument.js';
import { useDocumentTypes } from '../../hooks/useDocumentTypes.js';
import { useUpdateDocument } from '../../hooks/useUpdateDocument.js';
import { documentErrorMessage } from '../../lib/documentErrorMessage.js';
import { DocumentMetadataForm } from '../DocumentMetadataForm.js';

export function DocumentEditDialog({
  documentId,
  open,
  onOpenChange,
}: {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const document = useDocument(documentId ?? '');
  const types = useDocumentTypes();
  const update = useUpdateDocument(documentId ?? '');
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const requestOpenChange = (next: boolean) => {
    if (!next && dirty && !update.isPending) setConfirmDiscard(true);
    else onOpenChange(next);
  };
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={requestOpenChange}
        title="Upravit údaje dokumentu"
        description="Změny se uloží až po potvrzení formuláře."
        size="lg"
        mobileFullScreen
      >
        {document.isPending || types.isPending ? (
          <div className="grid min-h-64 place-items-center" role="status">
            <Spinner />
          </div>
        ) : document.isError || types.isError ? (
          <InlineAlert variant="danger">
            {documentErrorMessage(document.error ?? types.error)}
          </InlineAlert>
        ) : (
          <DocumentMetadataForm
            document={document.data}
            types={types.data.items}
            submitting={update.isPending}
            error={update.error ? documentErrorMessage(update.error) : null}
            onDirtyChange={setDirty}
            onCancel={() => requestOpenChange(false)}
            onSubmit={(input) =>
              update.mutate(input, {
                onSuccess: () => {
                  setDirty(false);
                  onOpenChange(false);
                },
              })
            }
          />
        )}
      </Dialog>
      <Dialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Zahodit neuložené změny?"
        description="Úpravy formuláře nebudou uloženy."
        size="sm"
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={() => setConfirmDiscard(false)}>
            Pokračovat v úpravách
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirmDiscard(false);
              setDirty(false);
              onOpenChange(false);
            }}
          >
            Zahodit změny
          </Button>
        </div>
      </Dialog>
    </>
  );
}
