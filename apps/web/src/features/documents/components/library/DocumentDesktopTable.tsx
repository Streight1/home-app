import { Download, Eye, FileText } from 'lucide-react';
import { WorkspaceLink } from '../../../../app/workspace-navigation/WorkspaceLink.js';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import {
  formatDocumentAmount,
  formatDocumentDate,
} from '../../lib/documentFormat.js';
import type {
  DocumentListItem,
  DocumentTypeDefinition,
} from '../../types/document.types.js';
import { DocumentActionsMenu } from '../DocumentActionsMenu.js';
import type { DocumentLifecycleAction } from '../modals/DocumentLifecycleDialog.js';

export interface DocumentListActionProps {
  busyDocumentId?: string;
  onPreview: (document: DocumentListItem) => void;
  onEdit: (document: DocumentListItem) => void;
  onMove: (document: DocumentListItem) => void;
  onLifecycle: (
    document: DocumentListItem,
    action: DocumentLifecycleAction,
  ) => void;
  onDownload: (document: DocumentListItem) => void;
}

export function DocumentDesktopTable({
  documents,
  types,
  ...actions
}: {
  documents: DocumentListItem[];
  types: readonly DocumentTypeDefinition[];
} & DocumentListActionProps) {
  const labels = new Map(types.map((type) => [type.key, type.label]));
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised shadow-sm">
      <table className="w-full min-w-[48rem] border-collapse text-left text-body-sm">
        <caption className="sr-only">Dokumentová knihovna</caption>
        <thead className="bg-surface-subtle text-caption uppercase tracking-wide text-text-muted">
          <tr>
            <th className="px-4 py-3">Dokument</th>
            <th className="px-4 py-3">Datum</th>
            <th className="px-4 py-3 text-right">Částka</th>
            <th className="px-4 py-3">Složka</th>
            <th className="px-4 py-3">
              <span className="sr-only">Akce</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {documents.map((document) => (
            <tr key={document.id} className="hover:bg-surface-hover">
              <th className="max-w-md px-4 py-3 font-normal">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-emphasis">
                    <FileText className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <WorkspaceLink
                      view={{
                        area: 'documents',
                        screen: 'detail',
                        documentId: document.id,
                      }}
                      className="font-semibold text-text hover:text-primary-emphasis focus-visible:outline-2 focus-visible:outline-focus"
                    >
                      {document.presentation.primaryLabel}
                    </WorkspaceLink>
                    {document.presentation.secondaryLabel ? (
                      <p className="mt-0.5 line-clamp-2 text-caption text-text-muted">
                        {document.presentation.secondaryLabel}
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {document.presentation.referenceLabel ? (
                        <span className="text-caption text-text-subtle">
                          {document.presentation.referenceLabel}
                        </span>
                      ) : null}
                      <Badge>
                        {labels.get(document.type) ?? document.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </th>
              <td className="tabular-nums px-4 py-3 text-text-muted">
                {document.presentation.documentDate
                  ? formatDocumentDate(document.presentation.documentDate)
                  : '—'}
              </td>
              <td className="tabular-nums px-4 py-3 text-right font-medium text-text">
                {document.presentation.amount
                  ? formatDocumentAmount(
                      document.presentation.amount.minorUnits,
                      document.presentation.amount.currencyCode,
                    )
                  : '—'}
              </td>
              <td className="px-4 py-3 text-text-muted">
                {document.folder?.name ?? 'Kořen'}
              </td>
              <td className="px-4 py-2">
                <div className="flex justify-end gap-1">
                  <IconButton
                    aria-label={`Náhled: ${document.presentation.primaryLabel}`}
                    variant="ghost"
                    disabled={!document.canPreview}
                    onClick={() => actions.onPreview(document)}
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    aria-label={`Stáhnout: ${document.presentation.primaryLabel}`}
                    variant="ghost"
                    disabled={!document.file}
                    onClick={() => actions.onDownload(document)}
                  >
                    <Download className="size-4" aria-hidden="true" />
                  </IconButton>
                  <DocumentActionsMenu
                    document={document}
                    busy={actions.busyDocumentId === document.id}
                    onEdit={() => actions.onEdit(document)}
                    onMove={() => actions.onMove(document)}
                    onLifecycle={(action) =>
                      actions.onLifecycle(document, action)
                    }
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
