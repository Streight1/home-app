import { Archive, Pencil, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button/Button.js';
import { Card } from '../../../components/ui/Card/Card.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../components/ui/Spinner/Spinner.js';
import { DocumentDetailHeader } from '../components/DocumentDetailHeader.js';
import { DocumentFilePanel } from '../components/DocumentFilePanel.js';
import { DocumentMetadataForm } from '../components/DocumentMetadataForm.js';
import { DocumentInformation } from '../components/detail/DocumentInformation.js';
import { DocumentMoveControl } from '../components/detail/DocumentMoveControl.js';
import { useArchiveDocument } from '../hooks/useArchiveDocument.js';
import { useDocument } from '../hooks/useDocument.js';
import { useDocumentFolders } from '../hooks/useDocumentFolders.js';
import { useDocumentTypes } from '../hooks/useDocumentTypes.js';
import { useDownloadDocumentFile } from '../hooks/useDownloadDocumentFile.js';
import { useMoveDocument } from '../hooks/useMoveDocument.js';
import { useRestoreDocument } from '../hooks/useRestoreDocument.js';
import { useUpdateDocument } from '../hooks/useUpdateDocument.js';
import { documentErrorMessage } from '../lib/documentErrorMessage.js';
import type {
  HouseholdRole,
  UpdateDocumentInput,
} from '../types/document.types.js';

export function DocumentDetailPage({
  role,
  documentId,
}: {
  role: HouseholdRole;
  documentId: string;
}) {
  const documentQuery = useDocument(documentId);
  const folders = useDocumentFolders();
  const types = useDocumentTypes();
  const update = useUpdateDocument(documentId);
  const move = useMoveDocument(documentId);
  const archive = useArchiveDocument();
  const restore = useRestoreDocument();
  const download = useDownloadDocumentFile();
  const [editing, setEditing] = useState(false);
  const canMutate = role !== 'VIEWER';

  if (documentQuery.isPending || folders.isPending || types.isPending) {
    return (
      <div className="grid min-h-64 place-items-center" role="status">
        <span className="flex items-center gap-3 text-body-sm text-text-muted">
          <Spinner /> Načítáme dokument…
        </span>
      </div>
    );
  }
  if (documentQuery.isError || folders.isError || types.isError) {
    return (
      <InlineAlert variant="danger" title="Dokument nelze zobrazit">
        {documentErrorMessage(
          documentQuery.error ?? folders.error ?? types.error,
        )}
      </InlineAlert>
    );
  }

  const document = documentQuery.data;
  const documentFile = document.file;
  const definitions = types.data.items;
  const definition = definitions.find((type) => type.key === document.type);
  const submitUpdate = (input: UpdateDocumentInput) => {
    update.mutate(input, { onSuccess: () => setEditing(false) });
  };
  const mutationError =
    update.error ??
    move.error ??
    archive.error ??
    restore.error ??
    download.error;

  return (
    <div>
      <DocumentDetailHeader document={document} />
      {mutationError ? (
        <div className="mb-5">
          <InlineAlert variant="danger">
            {documentErrorMessage(mutationError)}
          </InlineAlert>
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-5">
          {editing ? (
            <Card className="p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-section-title font-semibold text-text">
                  Základní údaje
                </h2>
                <Button size="sm" onClick={() => setEditing(false)}>
                  Zrušit úpravy
                </Button>
              </div>
              <div className="mt-5">
                <DocumentMetadataForm
                  document={document}
                  types={definitions}
                  submitting={update.isPending}
                  error={
                    update.isError ? documentErrorMessage(update.error) : null
                  }
                  onCancel={() => setEditing(false)}
                  onSubmit={submitUpdate}
                />
              </div>
            </Card>
          ) : (
            <div>
              <div className="mb-3 flex justify-end">
                {canMutate ? (
                  <Button size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="size-4" aria-hidden="true" /> Upravit
                  </Button>
                ) : null}
              </div>
              <DocumentInformation
                document={document}
                definition={definition}
              />
            </div>
          )}
          {documentFile ? (
            <DocumentFilePanel
              file={documentFile}
              documentId={document.id}
              extractionAvailable={
                document.type === 'INVOICE' || document.type === 'RECEIPT'
              }
              downloading={download.isPending}
              onDownload={() =>
                download.mutate({ documentId: document.id, file: documentFile })
              }
            />
          ) : null}
        </div>

        <Card className="h-fit p-5 md:p-6">
          <h2 className="text-section-title font-semibold text-text">Akce</h2>
          <p className="mt-2 text-body-sm text-text-muted">
            Archivace soubor nemaže. Dokument můžete později obnovit.
          </p>
          {canMutate ? (
            document.status === 'ACTIVE' ? (
              <Button
                className="mt-4 w-full"
                loading={archive.isPending}
                onClick={() => archive.mutate(document.id)}
              >
                <Archive className="size-4" aria-hidden="true" /> Archivovat
              </Button>
            ) : (
              <Button
                variant="primary"
                className="mt-4 w-full"
                loading={restore.isPending}
                onClick={() => restore.mutate(document.id)}
              >
                <RotateCcw className="size-4" aria-hidden="true" /> Obnovit
              </Button>
            )
          ) : (
            <p className="mt-4 rounded-md bg-surface-subtle p-3 text-caption text-text-muted">
              Máte oprávnění pouze ke čtení a stažení dokumentu.
            </p>
          )}
          {canMutate ? (
            <DocumentMoveControl
              folders={folders.data.items}
              currentFolderId={document.folder?.id ?? null}
              pending={move.isPending}
              onMove={(folderId) => move.mutate(folderId)}
            />
          ) : null}
        </Card>
      </div>
    </div>
  );
}
