import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../../components/ui/Spinner/Spinner.js';
import { documentErrorMessage } from '../../lib/documentErrorMessage.js';
import type {
  DocumentListItem,
  DocumentListResponse,
  DocumentPageSize,
  DocumentStatus,
  DocumentTypeDefinition,
} from '../../types/document.types.js';
import { DocumentEmptyState } from '../DocumentEmptyState.js';
import { DocumentList } from '../DocumentList.js';
import { DocumentPagination } from './DocumentPagination.js';
import type { DocumentLifecycleAction } from '../modals/DocumentLifecycleDialog.js';

interface DocumentLibraryResultsProps {
  data: DocumentListResponse | undefined;
  pending: boolean;
  fetching: boolean;
  error: unknown;
  status: DocumentStatus;
  types: readonly DocumentTypeDefinition[];
  busyDocumentId?: string | undefined;
  onPreview: (document: DocumentListItem) => void;
  onEdit: (document: DocumentListItem) => void;
  onMove: (document: DocumentListItem) => void;
  onLifecycle: (
    document: DocumentListItem,
    action: DocumentLifecycleAction,
  ) => void;
  onDownload: (document: DocumentListItem) => void;
  onPage: (page: number) => void;
  onPageSize: (pageSize: DocumentPageSize) => void;
}

export function DocumentLibraryResults({
  data,
  pending,
  fetching,
  error,
  status,
  types,
  busyDocumentId,
  onPreview,
  onEdit,
  onMove,
  onLifecycle,
  onDownload,
  onPage,
  onPageSize,
}: DocumentLibraryResultsProps) {
  if (pending) {
    return (
      <div className="grid min-h-56 place-items-center rounded-lg border border-border bg-surface-raised">
        <div
          className="flex items-center gap-3 text-body-sm text-text-muted"
          role="status"
        >
          <Spinner /> Načítáme dokumenty…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <InlineAlert variant="danger">{documentErrorMessage(error)}</InlineAlert>
    );
  }
  if (!data || data.items.length === 0) {
    return <DocumentEmptyState status={status} />;
  }
  return (
    <>
      <DocumentList
        documents={data.items}
        types={types}
        {...(busyDocumentId ? { busyDocumentId } : {})}
        onPreview={onPreview}
        onEdit={onEdit}
        onMove={onMove}
        onLifecycle={onLifecycle}
        onDownload={onDownload}
      />
      <DocumentPagination
        page={data.pagination.page}
        pageSize={data.pagination.pageSize as DocumentPageSize}
        totalPages={data.pagination.totalPages}
        disabled={fetching}
        onPage={onPage}
        onPageSize={onPageSize}
      />
    </>
  );
}
