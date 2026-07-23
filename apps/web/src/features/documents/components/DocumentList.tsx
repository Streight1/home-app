import { useCompactDocumentsLayout } from '../hooks/useCompactDocumentsLayout.js';
import type {
  DocumentListItem,
  DocumentTypeDefinition,
} from '../types/document.types.js';
import {
  DocumentDesktopTable,
  type DocumentListActionProps,
} from './library/DocumentDesktopTable.js';
import { DocumentMobileList } from './library/DocumentMobileList.js';

export function DocumentList({
  documents,
  types = [],
  ...actions
}: {
  documents: DocumentListItem[];
  types?: readonly DocumentTypeDefinition[];
} & DocumentListActionProps) {
  const compact = useCompactDocumentsLayout();
  return compact ? (
    <DocumentMobileList documents={documents} {...actions} />
  ) : (
    <DocumentDesktopTable documents={documents} types={types} {...actions} />
  );
}
