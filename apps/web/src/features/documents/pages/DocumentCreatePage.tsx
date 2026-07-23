import { ArrowLeft } from 'lucide-react';
import { WorkspaceLink } from '../../../app/workspace-navigation/WorkspaceLink.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { DocumentUploadForm } from '../components/DocumentUploadForm.js';
import { useCreateDocument } from '../hooks/useCreateDocument.js';
import { useDocumentFolders } from '../hooks/useDocumentFolders.js';
import { useDocumentTypes } from '../hooks/useDocumentTypes.js';
import { documentErrorMessage } from '../lib/documentErrorMessage.js';
import type { HouseholdRole } from '../types/document.types.js';

export function DocumentCreatePage({ role }: { role: HouseholdRole }) {
  const createDocument = useCreateDocument();
  const folders = useDocumentFolders();
  const types = useDocumentTypes();
  if (role === 'VIEWER') {
    return (
      <InlineAlert variant="danger" title="Nedostatečné oprávnění">
        Dokumenty mohou přidávat členové, správci a vlastníci domácnosti.
      </InlineAlert>
    );
  }
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 md:mb-8">
        <WorkspaceLink
          view={{ area: 'documents', screen: 'list' }}
          className="inline-flex min-h-11 items-center gap-2 rounded-md text-body-sm font-medium text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Zpět na dokumenty
        </WorkspaceLink>
        <h1 className="mt-3 text-page-title font-semibold tracking-tight text-text">
          Přidat dokument
        </h1>
        <p className="mt-2 text-body-sm text-text-muted">
          Soubor bude dostupný pouze členům aktivní domácnosti podle jejich
          oprávnění.
        </p>
      </header>
      <DocumentUploadForm
        folders={folders.data?.items ?? []}
        types={types.data?.items ?? []}
        submitting={createDocument.isPending}
        serverError={
          createDocument.isError
            ? documentErrorMessage(createDocument.error)
            : null
        }
        onSubmit={(input) => createDocument.mutate(input)}
      />
    </div>
  );
}
