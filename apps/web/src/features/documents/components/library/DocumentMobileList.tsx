import { Eye, FileText } from 'lucide-react';
import { WorkspaceLink } from '../../../../app/workspace-navigation/WorkspaceLink.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import {
  formatDocumentAmount,
  formatDocumentDate,
} from '../../lib/documentFormat.js';
import type { DocumentListItem } from '../../types/document.types.js';
import { DocumentActionsMenu } from '../DocumentActionsMenu.js';
import type { DocumentListActionProps } from './DocumentDesktopTable.js';

export function DocumentMobileList({
  documents,
  ...actions
}: { documents: DocumentListItem[] } & DocumentListActionProps) {
  return (
    <ul className="grid gap-3 overflow-x-hidden" aria-label="Seznam dokumentů">
      {documents.map((document) => (
        <li
          key={document.id}
          className="rounded-lg border border-border bg-surface-raised p-4 shadow-sm"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-emphasis">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <WorkspaceLink
                view={{
                  area: 'documents',
                  screen: 'detail',
                  documentId: document.id,
                }}
                className="line-clamp-2 break-words font-semibold text-text focus-visible:outline-2 focus-visible:outline-focus"
              >
                {document.presentation.primaryLabel}
              </WorkspaceLink>
              {document.presentation.secondaryLabel ? (
                <p className="mt-1 line-clamp-2 break-words text-caption text-text-muted">
                  {document.presentation.secondaryLabel}
                </p>
              ) : null}
              <p className="tabular-nums mt-2 text-caption text-text-subtle">
                {document.presentation.documentDate
                  ? formatDocumentDate(document.presentation.documentDate)
                  : 'Bez data'}
                {document.presentation.amount
                  ? ` · ${formatDocumentAmount(document.presentation.amount.minorUnits, document.presentation.amount.currencyCode)}`
                  : ''}
              </p>
              <p className="mt-1 truncate text-caption text-text-subtle">
                {document.folder?.name ?? 'Kořen'}
              </p>
            </div>
            <DocumentActionsMenu
              document={document}
              busy={actions.busyDocumentId === document.id}
              onEdit={() => actions.onEdit(document)}
              onMove={() => actions.onMove(document)}
              onLifecycle={(action) => actions.onLifecycle(document, action)}
            />
          </div>
          <Button
            className="mt-3 w-full"
            disabled={!document.canPreview}
            onClick={() => actions.onPreview(document)}
          >
            <Eye className="size-4" aria-hidden="true" /> Náhled
          </Button>
        </li>
      ))}
    </ul>
  );
}
