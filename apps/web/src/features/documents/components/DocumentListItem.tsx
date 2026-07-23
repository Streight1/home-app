import { FileText } from 'lucide-react';
import { WorkspaceLink } from '../../../app/workspace-navigation/WorkspaceLink.js';
import {
  formatDocumentDate,
  formatDocumentType,
  formatFileSize,
} from '../lib/documentFormat.js';
import type { DocumentItem } from '../types/document.types.js';
import { DocumentStatusBadge } from './DocumentStatusBadge.js';

interface DocumentListItemProps {
  document: DocumentItem;
}

export function DocumentListItem({ document }: DocumentListItemProps) {
  return (
    <li className="rounded-lg border border-border bg-surface-raised p-4 shadow-sm">
      <div className="flex items-start gap-3">
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
            className="line-clamp-2 font-semibold text-text hover:text-primary-emphasis focus-visible:outline-2 focus-visible:outline-focus"
          >
            {document.title}
          </WorkspaceLink>
          <p className="mt-1 text-caption text-text-muted">
            {document.file
              ? `${formatDocumentType(document.file.mimeType)} · ${formatFileSize(document.file.sizeBytes)}`
              : 'Bez souboru'}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="tabular-nums text-caption text-text-muted">
          Přidáno {formatDocumentDate(document.createdAt)}
        </span>
        <DocumentStatusBadge status={document.status} />
      </div>
    </li>
  );
}
