import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadDocumentFile } from './api/documentFilesApi.js';
import { DocumentList } from './components/DocumentList.js';
import { DocumentUploadForm } from './components/DocumentUploadForm.js';
import { DocumentInformation } from './components/detail/DocumentInformation.js';
import { ExtractionReviewPanel } from './components/extraction/ExtractionReviewPanel.js';
import { FolderTree } from './components/folders/FolderTree.js';
import { DocumentMetadataFields } from './components/forms/DocumentMetadataFields.js';
import { DocumentPagination } from './components/library/DocumentPagination.js';
import { DocumentEditDialog } from './components/modals/DocumentEditDialog.js';
import { DocumentLifecycleDialog } from './components/modals/DocumentLifecycleDialog.js';
import { DocumentPreviewDialog } from './components/modals/DocumentPreviewDialog.js';
import { DocumentPreview } from './components/preview/DocumentPreview.js';
import { useArchiveDocument } from './hooks/useArchiveDocument.js';
import { useExtractionJob } from './hooks/useDocumentExtraction.js';
import { DocumentCreatePage } from './pages/DocumentCreatePage.js';
import { DocumentDetailPage } from './pages/DocumentDetailPage.js';
import { DocumentsPage } from './pages/DocumentsPage.js';
import { documentListQueryFromUrl } from './lib/documentListUrl.js';
import type {
  DocumentItem,
  DocumentListItem,
  DocumentMetadata,
  DocumentTypeDefinition,
  MetadataValue,
} from './types/document.types.js';
import { installTestPublicRuntimeConfig } from '../../lib/config/test-runtime-config.js';
import { WorkspaceNavigationProvider } from '../../app/workspace-navigation/WorkspaceNavigationProvider.js';

const documentFileFixture: NonNullable<DocumentItem['file']> = {
  id: '20000000-0000-4000-8000-000000000002',
  originalFilename: 'pojistka.pdf',
  extension: 'pdf',
  mimeType: 'application/pdf',
  detectedMimeType: 'application/pdf',
  sizeBytes: 1_024,
  createdAt: '2026-07-14T10:00:00.000Z',
};

const documentFixture: DocumentItem = {
  id: '10000000-0000-4000-8000-000000000001',
  title: 'Pojistná smlouva',
  description: 'Dokument domácnosti',
  notes: null,
  type: 'GENERAL',
  metadata: {},
  metadataSchemaVersion: 1,
  documentDate: null,
  folder: null,
  status: 'ACTIVE',
  createdAt: '2026-07-14T10:00:00.000Z',
  updatedAt: '2026-07-14T10:00:00.000Z',
  archivedAt: null,
  trashedAt: null,
  createdBy: { id: 'user-1', displayName: 'Jana Nováková' },
  file: documentFileFixture,
};

const documentListFixture: DocumentListItem = {
  id: documentFixture.id,
  type: documentFixture.type,
  title: documentFixture.title,
  folder: null,
  status: 'ACTIVE',
  trashedAt: null,
  presentation: {
    primaryLabel: 'Pojistná smlouva',
    secondaryLabel: 'Dokument domácnosti',
    referenceLabel: null,
    documentDate: null,
    amount: null,
  },
  canPreview: true,
  permissions: {
    canEdit: true,
    canArchive: true,
    canRestoreArchive: false,
    canMove: true,
    canMoveToTrash: true,
    canRestoreFromTrash: false,
    canPermanentlyDelete: false,
  },
  file: {
    id: documentFileFixture.id,
    originalFilename: documentFileFixture.originalFilename,
    extension: documentFileFixture.extension,
    mimeType: documentFileFixture.mimeType,
  },
};

const invoiceListFixture: DocumentListItem = {
  ...documentListFixture,
  type: 'INVOICE',
  title: '1234567890',
  presentation: {
    primaryLabel: 'Alza.cz',
    secondaryLabel: 'Notebook Lenovo ThinkPad a příslušenství',
    referenceLabel: 'Faktura 123456789',
    documentDate: '2026-07-14',
    amount: { minorUnits: 3_899_000, currencyCode: 'CZK' },
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderWithClient(element: ReactElement, path = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <WorkspaceNavigationProvider>{element}</WorkspaceNavigationProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

function pdfFile(name = 'pojistka.pdf'): File {
  return new File(
    [new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])],
    name,
    {
      type: 'application/pdf',
    },
  );
}

function documentsResponse(items: DocumentListItem[]) {
  return {
    items,
    pagination: {
      page: 1,
      pageSize: 20,
      totalItems: items.length,
      totalPages: items.length ? 1 : 0,
    },
  };
}

const generalType = {
  key: 'GENERAL' as const,
  label: 'Obecný dokument',
  description: 'Obecná metadata',
  schemaVersion: 1,
  fields: [],
};

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
}

function mockDocumentApi({
  list = [],
  detail = documentFixture,
  create = () => Promise.resolve(jsonResponse(documentFixture)),
}: {
  list?: DocumentListItem[];
  detail?: DocumentItem;
  create?: () => Promise<Response>;
} = {}) {
  vi.mocked(fetch).mockImplementation((input, init) => {
    const url = requestUrl(input);
    const method = init?.method ?? 'GET';
    if (url.includes('/document-folders'))
      return Promise.resolve(jsonResponse({ items: [] }));
    if (url.includes('/document-types'))
      return Promise.resolve(jsonResponse({ items: [generalType] }));
    if (url.endsWith('/documents') && method === 'POST') return create();
    if (url.includes(`/documents/${detail.id}`))
      return Promise.resolve(jsonResponse(detail));
    if (url.includes('/documents'))
      return Promise.resolve(jsonResponse(documentsResponse(list)));
    return Promise.resolve(jsonResponse({}, 404));
  });
}

describe('documents frontend', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('shows an empty state without demo documents', async () => {
    mockDocumentApi();
    renderWithClient(<DocumentsPage role="OWNER" />);
    expect(
      await screen.findByText('Zatím tu nejsou žádné dokumenty'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Přidat první dokument' }),
    ).toBeInTheDocument();
  });

  it('renders documents returned by the API', async () => {
    mockDocumentApi({ list: [documentListFixture] });
    renderWithClient(<DocumentsPage role="MEMBER" />);
    expect(
      await screen.findByRole('link', { name: 'Pojistná smlouva' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('uses the compact list without a desktop table on mobile', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }));
    renderWithClient(
      <DocumentList
        documents={[documentListFixture]}
        onPreview={() => undefined}
        onEdit={() => undefined}
        onMove={() => undefined}
        onLifecycle={() => undefined}
        onDownload={() => undefined}
      />,
    );
    expect(
      screen.getByRole('list', { name: 'Seznam dokumentů' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('presents an invoice by supplier and purpose without technical columns', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }));
    renderWithClient(
      <DocumentList
        documents={[invoiceListFixture]}
        onPreview={() => undefined}
        onEdit={() => undefined}
        onMove={() => undefined}
        onLifecycle={() => undefined}
        onDownload={() => undefined}
      />,
    );
    expect(screen.getByText('Alza.cz')).toBeInTheDocument();
    expect(
      screen.getByText('Notebook Lenovo ThinkPad a příslušenství'),
    ).toBeInTheDocument();
    expect(screen.getByText(/38[\s\u00a0]990,00/)).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Velikost' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Stav' }),
    ).not.toBeInTheDocument();
  });

  it('opens preview in an adaptive large dialog', async () => {
    mockDocumentApi();
    renderWithClient(
      <DocumentPreviewDialog
        documentId={documentFixture.id}
        open
        onOpenChange={() => undefined}
      />,
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Pojistná smlouva',
    });
    expect(dialog.className).toContain('h-[85vh]');
    expect(dialog.className).toContain('max-sm:h-[100dvh]');
  });

  it('asks before closing an edit dialog with unsaved changes', async () => {
    mockDocumentApi();
    renderWithClient(
      <DocumentEditDialog
        documentId={documentFixture.id}
        open
        onOpenChange={() => undefined}
      />,
    );
    const title = await screen.findByLabelText('Název dokumentu');
    await userEvent.clear(title);
    await userEvent.type(title, 'Změněný název');
    await userEvent.click(
      screen.getByRole('button', { name: 'Zavřít dialog' }),
    );
    expect(
      await screen.findByRole('dialog', { name: 'Zahodit neuložené změny?' }),
    ).toBeInTheDocument();
  });

  it('renders a separate trash view', async () => {
    mockDocumentApi();
    renderWithClient(<DocumentsPage role="ADMIN" trash />);
    expect(
      await screen.findByRole('heading', { name: 'Koš' }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/documents/trash'),
      expect.any(Object),
    );
  });

  it('requires the explicit SMAZAT confirmation for permanent deletion', async () => {
    renderWithClient(
      <DocumentLifecycleDialog
        document={{
          ...invoiceListFixture,
          status: 'TRASHED',
          permissions: {
            ...invoiceListFixture.permissions,
            canPermanentlyDelete: true,
          },
        }}
        action="delete"
        onClose={() => undefined}
      />,
    );
    const remove = screen.getByRole('button', { name: 'Trvale odstranit' });
    expect(remove).toBeDisabled();
    await userEvent.type(
      screen.getByLabelText('Pro potvrzení napište SMAZAT'),
      'SMAZAT',
    );
    expect(remove).toBeEnabled();
  });

  it('prefills the title from a selected filename', async () => {
    renderWithClient(
      <DocumentUploadForm submitting={false} onSubmit={() => undefined} />,
    );
    fireEvent.change(screen.getByLabelText('Vybrat soubor'), {
      target: { files: [pdfFile('Rodinná pojistka.pdf')] },
    });
    expect(
      await screen.findByDisplayValue('Rodinná pojistka'),
    ).toBeInTheDocument();
  });

  it('shows an error for an unsupported file', async () => {
    renderWithClient(
      <DocumentUploadForm submitting={false} onSubmit={() => undefined} />,
    );
    const html = new File(['<html>'], 'stranka.html', { type: 'text/html' });
    fireEvent.change(screen.getByLabelText('Vybrat soubor'), {
      target: { files: [html] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tento typ souboru není podporovaný.',
    );
  });

  it('shows an error for a file above the configured limit', async () => {
    installTestPublicRuntimeConfig({ MAX_UPLOAD_BYTES: 5 });
    renderWithClient(
      <DocumentUploadForm submitting={false} onSubmit={() => undefined} />,
    );
    fireEvent.change(screen.getByLabelText('Vybrat soubor'), {
      target: { files: [pdfFile()] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Soubor překračuje povolenou velikost.',
    );
  });

  it('prevents a second submit while an upload is pending', async () => {
    let resolveUpload: ((response: Response) => void) | undefined;
    mockDocumentApi({
      create: () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    });
    renderWithClient(
      <Routes>
        <Route
          path="/app/documents/new"
          element={<DocumentCreatePage role="MEMBER" />}
        />
      </Routes>,
      '/app/documents/new',
    );
    fireEvent.change(screen.getByLabelText('Vybrat soubor'), {
      target: { files: [pdfFile()] },
    });
    await screen.findByDisplayValue('pojistka');
    const submit = screen.getByRole('button', { name: 'Uložit dokument' });
    await userEvent.click(submit);
    await userEvent.click(submit);
    expect(
      vi
        .mocked(fetch)
        .mock.calls.filter(([, init]) => init?.body instanceof FormData),
    ).toHaveLength(1);
    resolveUpload?.(jsonResponse(documentFixture));
  });

  it('redirects to detail after a successful upload', async () => {
    mockDocumentApi();
    renderWithClient(
      <Routes>
        <Route
          path="/app/documents/new"
          element={<DocumentCreatePage role="MEMBER" />}
        />
      </Routes>,
      '/app/documents/new',
    );
    fireEvent.change(screen.getByLabelText('Vybrat soubor'), {
      target: { files: [pdfFile()] },
    });
    await screen.findByDisplayValue('pojistka');
    await userEvent.click(
      screen.getByRole('button', { name: 'Uložit dokument' }),
    );
    await waitFor(() =>
      expect(window.history.state).toMatchObject({
        homeAppWorkspace: {
          view: {
            area: 'documents',
            screen: 'detail',
            documentId: documentFixture.id,
          },
        },
      }),
    );
  });

  it('invalidates document queries after archive', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ ...documentFixture, status: 'ARCHIVED' }),
    );
    function ArchiveHarness() {
      const client = useQueryClient();
      const archive = useArchiveDocument();
      return (
        <button
          type="button"
          onClick={() => {
            client.setQueryData(
              ['documents', 'list'],
              documentsResponse([documentListFixture]),
            );
            archive.mutate(documentFixture.id);
          }}
        >
          Archivovat test
        </button>
      );
    }
    const { client } = renderWithClient(<ArchiveHarness />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Archivovat test' }),
    );
    await waitFor(() =>
      expect(client.getQueryState(['documents', 'list'])?.isInvalidated).toBe(
        true,
      ),
    );
  });

  it('does not show edit actions to a viewer', async () => {
    mockDocumentApi();
    renderWithClient(
      <Routes>
        <Route
          path="/app/documents/:documentId"
          element={
            <DocumentDetailPage role="VIEWER" documentId={documentFixture.id} />
          }
        />
      </Routes>,
      `/app/documents/${documentFixture.id}`,
    );
    expect(
      await screen.findByRole('heading', { name: 'Pojistná smlouva' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Upravit' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Máte oprávnění pouze ke čtení a stažení dokumentu.'),
    ).toBeInTheDocument();
  });

  it('downloads with credentials and revokes the object URL', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(new Blob(['pdf']), { status: 200 }),
    );
    const createObjectUrl = vi.fn().mockReturnValue('blob:test');
    const revokeObjectUrl = vi.fn();
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectUrl },
      revokeObjectURL: { configurable: true, value: revokeObjectUrl },
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    if (!documentFixture.file) throw new Error('Fixture file missing');
    await downloadDocumentFile(documentFixture.id, documentFixture.file);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/documents/${documentFixture.id}/file`),
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test');
  });

  it('leaves multipart Content-Type to the browser', async () => {
    mockDocumentApi();
    renderWithClient(
      <Routes>
        <Route
          path="/app/documents/new"
          element={<DocumentCreatePage role="MEMBER" />}
        />
      </Routes>,
      '/app/documents/new',
    );
    fireEvent.change(screen.getByLabelText('Vybrat soubor'), {
      target: { files: [pdfFile()] },
    });
    await screen.findByDisplayValue('pojistka');
    await userEvent.click(
      screen.getByRole('button', { name: 'Uložit dokument' }),
    );
    const uploadCall = vi
      .mocked(fetch)
      .mock.calls.find(([, init]) => init?.body instanceof FormData);
    const init = uploadCall?.[1];
    expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
    expect(init?.body).toBeInstanceOf(FormData);
  });

  it('stops loading and shows a safe API error', async () => {
    mockDocumentApi({
      create: () =>
        Promise.resolve(
          jsonResponse(
            { code: 'DOCUMENT_INVALID_FILE', message: 'Soubor odmítnut.' },
            415,
          ),
        ),
    });
    renderWithClient(
      <Routes>
        <Route
          path="/app/documents/new"
          element={<DocumentCreatePage role="MEMBER" />}
        />
      </Routes>,
      '/app/documents/new',
    );
    fireEvent.change(screen.getByLabelText('Vybrat soubor'), {
      target: { files: [pdfFile()] },
    });
    await screen.findByDisplayValue('pojistka');
    await userEvent.click(
      screen.getByRole('button', { name: 'Uložit dokument' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tento soubor nelze nahrát.',
    );
    expect(
      screen.getByRole('button', { name: 'Uložit dokument' }),
    ).toBeEnabled();
  });

  it('keeps the file picker and form keyboard accessible', async () => {
    renderWithClient(
      <DocumentUploadForm submitting={false} onSubmit={() => undefined} />,
    );
    const picker = screen.getByLabelText('Vybrat soubor');
    expect(picker).toHaveAttribute('type', 'file');
    expect(picker).not.toBeDisabled();
    await userEvent.tab();
    expect(document.activeElement).toBe(picker);
  });

  it('offers only the supported page sizes', () => {
    renderWithClient(
      <DocumentPagination
        page={1}
        pageSize={20}
        totalPages={3}
        disabled={false}
        onPage={() => undefined}
        onPageSize={() => undefined}
      />,
    );
    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['10', '20', '50', '100']);
  });

  it('updates page size in the API query and resets the page to one', async () => {
    mockDocumentApi({ list: [documentListFixture] });
    renderWithClient(
      <DocumentsPage role="MEMBER" />,
      '/app/documents?page=3&pageSize=20',
    );
    await userEvent.selectOptions(
      await screen.findByLabelText('Položek na stránku'),
      '100',
    );
    await waitFor(() =>
      expect(
        vi
          .mocked(fetch)
          .mock.calls.some(([url]) =>
            requestUrl(url).includes('page=1&pageSize=100'),
          ),
      ).toBe(true),
    );
  });

  it('restores page size and filters from a refreshed URL', () => {
    expect(
      documentListQueryFromUrl(
        new URLSearchParams(
          'page=4&pageSize=50&folderId=root&type=INVOICE&sortBy=title&sortDirection=asc',
        ),
      ),
    ).toMatchObject({
      page: 4,
      pageSize: 50,
      folderId: 'root',
      type: 'INVOICE',
      sortBy: 'title',
      sortDirection: 'asc',
    });
  });

  it('renders the hierarchical folder tree and exposes accessible movement', async () => {
    renderWithClient(
      <FolderTree
        folders={[
          {
            id: 'folder-a',
            name: 'Pojištění',
            parentId: null,
            children: [
              {
                id: 'folder-b',
                name: 'Vozidlo',
                parentId: 'folder-a',
                children: [],
              },
            ],
          },
        ]}
        selectedId={null}
        canMutate
        onSelect={() => undefined}
        onRename={() => undefined}
        onMove={() => undefined}
        onDelete={() => undefined}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Pojištění' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vozidlo' })).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Akce složky Pojištění' }),
    );
    expect(
      await screen.findByRole('menuitem', { name: 'Přesunout' }),
    ).toBeInTheDocument();
  });

  it('renders notes as escaped plain text', () => {
    const notes = '<img src=x onerror=alert(1)>\nDruhý řádek';
    renderWithClient(
      <DocumentInformation
        document={{ ...documentFixture, notes }}
        definition={generalType}
      />,
    );
    expect(
      [...document.querySelectorAll('dd')].some(
        (element) => element.textContent === notes,
      ),
    ).toBe(true);
    expect(document.querySelector('img')).toBeNull();
  });

  it('renders metadata fields from the versioned type definition', async () => {
    const values: DocumentMetadata = {};
    const invoice: DocumentTypeDefinition = {
      ...generalType,
      key: 'INVOICE',
      label: 'Faktura',
      fields: [
        {
          key: 'invoiceNumber',
          label: 'Číslo faktury',
          type: 'STRING',
          required: true,
          searchable: true,
          filterable: false,
        },
      ],
    };
    const onChange = vi.fn((key: string, value: MetadataValue | undefined) => {
      if (value !== undefined) values[key] = value;
    });
    renderWithClient(
      <DocumentMetadataFields
        definition={invoice}
        values={values}
        onChange={onChange}
      />,
    );
    await userEvent.type(screen.getByLabelText('Číslo faktury'), 'FV-2026');
    expect(onChange).toHaveBeenLastCalledWith('invoiceNumber', '6');
  });

  it('does not request an unsupported Office preview', () => {
    renderWithClient(
      <DocumentPreview
        document={{
          ...documentFixture,
          file: {
            ...documentFileFixture,
            mimeType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        }}
      />,
    );
    expect(
      screen.getByText('Náhled tohoto formátu není dostupný'),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('releases the authenticated preview object URL on unmount', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(new Blob(['%PDF-1.7'], { type: 'application/pdf' }), {
        headers: { 'Content-Type': 'application/pdf' },
      }),
    );
    const createObjectUrl = vi.fn().mockReturnValue('blob:preview');
    const revokeObjectUrl = vi.fn();
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectUrl },
      revokeObjectURL: { configurable: true, value: revokeObjectUrl },
    });
    const { unmount } = renderWithClient(
      <DocumentPreview
        document={{
          ...documentFixture,
          file: { ...documentFileFixture, mimeType: 'application/pdf' },
        }}
      />,
    );
    expect(
      await screen.findByLabelText('Náhled PDF: Pojistná smlouva'),
    ).toBeInTheDocument();
    unmount();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:preview');
  });

  it('hides review mutations from a viewer', () => {
    renderWithClient(
      <ExtractionReviewPanel
        job={{
          id: 'job',
          documentId: documentFixture.id,
          status: 'REVIEW_REQUIRED',
          extractionType: 'STRUCTURED_DATA',
          extractor: { key: 'pdf-text-layer', version: '1' },
          schemaVersion: 1,
          errorCode: null,
          startedAt: null,
          finishedAt: null,
          createdAt: '2026-07-14T10:00:00.000Z',
          candidates: [
            {
              id: 'candidate',
              fieldKey: 'invoiceNumber',
              rawValue: 'FV-1',
              normalizedValue: 'FV-1',
              confidence: 0.9,
              confidenceReasons: ['EXACT_LABEL_MATCH'],
              sourcePage: 1,
              sourceText: 'Číslo faktury: FV-1',
              sourceRegion: null,
              status: 'PROPOSED',
              reviewedAt: null,
            },
          ],
        }}
        definition={undefined}
        canMutate={false}
        busy={false}
        onReview={() => undefined}
        onAcceptSafe={() => undefined}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Přijmout' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Jistota 90 % · strana 1')).toBeInTheDocument();
  });

  it('stops extraction polling when the job is completed', async () => {
    const completed = {
      id: 'job',
      documentId: documentFixture.id,
      status: 'COMPLETED' as const,
      extractionType: 'STRUCTURED_DATA' as const,
      extractor: { key: 'pdf-text-layer', version: '1' },
      schemaVersion: 1,
      errorCode: null,
      startedAt: null,
      finishedAt: null,
      createdAt: '2026-07-14T10:00:00.000Z',
      candidates: [],
    };
    vi.mocked(fetch).mockResolvedValue(jsonResponse(completed));
    function PollProbe() {
      const query = useExtractionJob(documentFixture.id, 'job');
      return <p>{query.data?.status ?? 'loading'}</p>;
    }
    renderWithClient(<PollProbe />);
    expect(await screen.findByText('COMPLETED')).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
