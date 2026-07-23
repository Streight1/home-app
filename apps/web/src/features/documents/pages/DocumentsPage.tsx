import { useState } from 'react';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { DocumentFolderNavigation } from '../components/folders/DocumentFolderNavigation.js';
import { flattenFolders } from '../components/folders/folderOptions.js';
import { DocumentLibraryHeader } from '../components/library/DocumentLibraryHeader.js';
import { DocumentLibraryResults } from '../components/library/DocumentLibraryResults.js';
import { DocumentLibraryToolbar } from '../components/library/DocumentLibraryToolbar.js';
import {
  DocumentLibraryModals,
  type DocumentLibraryModalState,
} from '../components/modals/DocumentLibraryModals.js';
import {
  useCreateFolder,
  useDeleteFolder,
  useDocumentFolders,
  useMoveFolder,
  useRenameFolder,
} from '../hooks/useDocumentFolders.js';
import { useDocumentTypes } from '../hooks/useDocumentTypes.js';
import { useDocuments } from '../hooks/useDocuments.js';
import { useDownloadDocumentFile } from '../hooks/useDownloadDocumentFile.js';
import { documentErrorMessage } from '../lib/documentErrorMessage.js';
import type {
  DocumentListItem,
  DocumentListQuery,
  HouseholdRole,
} from '../types/document.types.js';

export function DocumentsPage({
  role,
  trash = false,
}: {
  role: HouseholdRole;
  trash?: boolean;
}) {
  const workspace = useWorkspaceNavigation();
  const [listQuery, setListQuery] = useState<DocumentListQuery>({
    page: 1,
    pageSize: 20,
    status: 'ACTIVE',
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
  const query: DocumentListQuery = {
    ...listQuery,
    status: trash ? 'TRASHED' : listQuery.status,
  };
  const view = trash
    ? 'trash'
    : query.status === 'ARCHIVED'
      ? 'archived'
      : 'active';
  const documents = useDocuments(query, trash ? 'trash' : 'library');
  const folders = useDocumentFolders();
  const types = useDocumentTypes();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const moveFolder = useMoveFolder();
  const deleteFolder = useDeleteFolder();
  const download = useDownloadDocumentFile();
  const [modal, setModal] = useState<DocumentLibraryModalState>(null);
  const canMutate = role !== 'VIEWER';
  const folderItems = folders.data?.items ?? [];
  const typeItems = types.data?.items ?? [];
  const selectedFolder = trash ? null : (query.folderId ?? null);
  const currentFolderName =
    selectedFolder === null
      ? 'Všechny dokumenty'
      : selectedFolder === 'root'
        ? 'Kořen knihovny'
        : (flattenFolders(folderItems).find(
            (item) => item.id === selectedFolder,
          )?.label ?? 'Složka');
  const updateQuery = (
    changes: Partial<DocumentListQuery>,
    preservePage = false,
  ) => {
    setListQuery((current) => ({
      ...current,
      ...query,
      ...changes,
      ...(!preservePage ? { page: 1 } : {}),
    }));
  };
  const mutationError =
    createFolder.error ??
    renameFolder.error ??
    moveFolder.error ??
    deleteFolder.error ??
    download.error;
  const downloadDocument = (document: DocumentListItem) => {
    if (document.file)
      download.mutate({ documentId: document.id, file: document.file });
  };
  return (
    <div>
      <DocumentLibraryHeader
        canMutate={canMutate}
        view={view}
        onViewChange={(nextView) => {
          if (nextView === 'trash') {
            workspace.navigate({ area: 'documents', screen: 'trash' });
            return;
          }
          if (trash) workspace.navigate({ area: 'documents', screen: 'list' });
          setListQuery((current) => ({
            ...current,
            page: 1,
            status: nextView === 'archived' ? 'ARCHIVED' : 'ACTIVE',
          }));
        }}
      />
      {mutationError ? (
        <div className="mb-5">
          <InlineAlert variant="danger">
            {documentErrorMessage(mutationError)}
          </InlineAlert>
        </div>
      ) : null}
      <div
        className={trash ? '' : 'grid gap-5 md:grid-cols-[15rem_minmax(0,1fr)]'}
      >
        {!trash ? (
          <DocumentFolderNavigation
            folders={folderItems}
            selectedId={selectedFolder}
            currentName={currentFolderName}
            canMutate={canMutate}
            includeSubfolders={query.includeSubfolders ?? false}
            creating={createFolder.isPending}
            createError={createFolder.error}
            onSelect={(folderId) =>
              updateQuery({
                folderId: folderId ?? undefined,
                includeSubfolders: false,
              })
            }
            onCreate={(input) => createFolder.mutate(input)}
            onRename={(folderId, name) =>
              renameFolder.mutate({ folderId, name })
            }
            onMove={(folderId, parentId) =>
              moveFolder.mutate({ folderId, parentId })
            }
            onDelete={(folderId) => deleteFolder.mutate(folderId)}
            onIncludeSubfolders={(includeSubfolders) =>
              updateQuery({ includeSubfolders })
            }
          />
        ) : null}
        <main className="min-w-0">
          {!trash ? (
            <p className="mb-3 text-caption text-text-muted">
              Umístění:{' '}
              <span className="font-medium text-text">{currentFolderName}</span>
            </p>
          ) : null}
          <DocumentLibraryToolbar
            query={query}
            types={typeItems}
            onChange={updateQuery}
          />
          <div className="mt-5">
            <DocumentLibraryResults
              data={documents.data}
              pending={documents.isPending}
              fetching={documents.isFetching}
              error={documents.error}
              status={query.status ?? 'ACTIVE'}
              types={typeItems}
              onPreview={(document) =>
                workspace.openOverlay({
                  kind: 'document-preview',
                  documentId: document.id,
                })
              }
              onEdit={(document) => setModal({ type: 'edit', document })}
              onMove={(document) => setModal({ type: 'move', document })}
              onLifecycle={(document, action) =>
                setModal({ type: 'lifecycle', document, action })
              }
              onDownload={downloadDocument}
              onPage={(page) => updateQuery({ page }, true)}
              onPageSize={(pageSize) => updateQuery({ pageSize })}
            />
          </div>
        </main>
      </div>
      <DocumentLibraryModals modal={modal} setModal={setModal} />
    </div>
  );
}
