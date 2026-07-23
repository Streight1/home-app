import { ArrowLeft, Download } from 'lucide-react';
import { WorkspaceLink } from '../../../app/workspace-navigation/WorkspaceLink.js';
import { Button } from '../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../components/ui/Spinner/Spinner.js';
import { DocumentPreview } from '../components/preview/DocumentPreview.js';
import { useDocument } from '../hooks/useDocument.js';
import { useDownloadDocumentFile } from '../hooks/useDownloadDocumentFile.js';
import { documentErrorMessage } from '../lib/documentErrorMessage.js';

export function DocumentPreviewPage({ documentId }: { documentId: string }) {
  const query = useDocument(documentId);
  const download = useDownloadDocumentFile();
  if (query.isPending) {
    return (
      <div className="grid min-h-64 place-items-center" role="status">
        <span className="flex items-center gap-3 text-body-sm text-text-muted">
          <Spinner /> Načítáme dokument…
        </span>
      </div>
    );
  }
  if (query.isError) {
    return (
      <InlineAlert variant="danger">
        {documentErrorMessage(query.error)}
      </InlineAlert>
    );
  }
  const document = query.data;
  const documentFile = document.file;
  return (
    <div>
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <WorkspaceLink
            view={{
              area: 'documents',
              screen: 'detail',
              documentId: document.id,
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-md text-body-sm font-medium text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Zpět na detail
          </WorkspaceLink>
          <h1 className="mt-2 break-words text-page-title font-semibold text-text">
            {document.title}
          </h1>
        </div>
        {documentFile ? (
          <Button
            loading={download.isPending}
            onClick={() =>
              download.mutate({ documentId: document.id, file: documentFile })
            }
          >
            <Download className="size-4" aria-hidden="true" /> Stáhnout
          </Button>
        ) : null}
      </header>
      {download.isError ? (
        <div className="mb-4">
          <InlineAlert variant="danger">
            {documentErrorMessage(download.error)}
          </InlineAlert>
        </div>
      ) : null}
      <DocumentPreview document={document} />
    </div>
  );
}
