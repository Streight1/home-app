import { Download } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../../components/ui/Spinner/Spinner.js';
import { useDocument } from '../../hooks/useDocument.js';
import { useDownloadDocumentFile } from '../../hooks/useDownloadDocumentFile.js';
import { documentErrorMessage } from '../../lib/documentErrorMessage.js';
import { DocumentPreview } from '../preview/DocumentPreview.js';

export function DocumentPreviewDialog({
  documentId,
  open,
  onOpenChange,
}: {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const document = useDocument(documentId ?? '');
  const download = useDownloadDocumentFile();
  const item = document.data;
  const itemFile = item?.file ?? null;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={item?.title ?? 'Náhled dokumentu'}
      description="Zabezpečený náhled souboru"
      size="viewport"
      mobileFullScreen
    >
      {document.isPending ? (
        <div className="grid min-h-64 place-items-center" role="status">
          <Spinner />
        </div>
      ) : document.isError || !item ? (
        <InlineAlert variant="danger">
          {documentErrorMessage(document.error)}
        </InlineAlert>
      ) : (
        <div className="grid h-full gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-h-0 overflow-auto rounded-lg border border-border bg-canvas-subtle">
            <DocumentPreview document={item} />
          </div>
          <aside className="grid content-start gap-4">
            <div>
              <p className="text-caption text-text-subtle">Dokument</p>
              <p className="mt-1 font-semibold text-text">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-body-sm text-text-muted">
                  {item.description}
                </p>
              ) : null}
            </div>
            {itemFile ? (
              <Button
                variant="primary"
                loading={download.isPending}
                onClick={() =>
                  download.mutate({ documentId: item.id, file: itemFile })
                }
              >
                <Download className="size-4" aria-hidden="true" /> Stáhnout
              </Button>
            ) : null}
          </aside>
        </div>
      )}
    </Dialog>
  );
}
