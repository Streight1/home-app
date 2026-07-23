import { ArrowLeft } from 'lucide-react';
import { WorkspaceLink } from '../../../app/workspace-navigation/WorkspaceLink.js';
import type { DocumentItem } from '../types/document.types.js';
import { DocumentStatusBadge } from './DocumentStatusBadge.js';

export function DocumentDetailHeader({ document }: { document: DocumentItem }) {
  return (
    <header className="mb-6 md:mb-8">
      <WorkspaceLink
        view={{ area: 'documents', screen: 'list' }}
        className="inline-flex min-h-11 items-center gap-2 rounded-md text-body-sm font-medium text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Zpět na dokumenty
      </WorkspaceLink>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-wide text-primary-emphasis">
            Dokument
          </p>
          <h1 className="mt-2 break-words text-page-title font-semibold tracking-tight text-text">
            {document.title}
          </h1>
        </div>
        <DocumentStatusBadge status={document.status} />
      </div>
    </header>
  );
}
