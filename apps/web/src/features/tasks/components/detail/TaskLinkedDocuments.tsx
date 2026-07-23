import { ExternalLink, FileText } from 'lucide-react';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import type { LinkedTaskDocument } from '../../types/task.types.js';
import { useDocumentNavigation } from '../../../documents/documents.public.js';

export function TaskLinkedDocuments({
  documents,
}: {
  documents: LinkedTaskDocument[];
}) {
  const navigation = useDocumentNavigation();
  return (
    <section aria-labelledby="linked-documents-title">
      <h2
        id="linked-documents-title"
        className="text-section-title font-semibold"
      >
        Připojené dokumenty
      </h2>
      {documents.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            compact
            title="Bez dokumentů"
            description="Dokument lze připojit při úpravě úkolu."
          />
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex min-h-14 items-center gap-3 p-3"
            >
              <FileText className="size-5 text-text-muted" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">
                {document.primaryLabel}
              </span>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-body-sm text-primary-emphasis focus-visible:outline-2 focus-visible:outline-focus"
                onClick={() =>
                  document.canPreview
                    ? navigation.openDocumentPreview(document.id)
                    : navigation.openDocument(document.id)
                }
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Otevřít
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
