import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const outputDirectory = '/tmp/homeapp-document-lifecycle-review';
const documentId = '10000000-0000-4000-8000-000000000001';
const folderId = '20000000-0000-4000-8000-000000000002';

const detail = {
  id: documentId,
  title: 'Faktura za notebook',
  description: 'Pracovní notebook a příslušenství',
  notes: 'Dodání proběhlo v pořádku.',
  type: 'INVOICE',
  metadata: {
    supplierName: 'Alza.cz',
    purchaseSummary: 'Notebook Lenovo ThinkPad a příslušenství',
    invoiceNumber: 'FV-SYN-2026-77',
    issueDate: '2026-07-14',
    dueDate: '2026-07-28',
    totalAmountMinor: 3_899_000,
    currencyCode: 'CZK',
    variableSymbol: '2026077001',
    lineItems: [{ description: 'Notebook Lenovo ThinkPad', quantity: '1' }],
  },
  metadataSchemaVersion: 2,
  documentDate: '2026-07-14',
  folder: { id: folderId, name: 'Počítače' },
  status: 'ACTIVE',
  createdAt: '2026-07-14T10:00:00.000Z',
  updatedAt: '2026-07-14T10:00:00.000Z',
  archivedAt: null,
  trashedAt: null,
  createdBy: { id: 'user-1', displayName: 'Adam Novák' },
  file: {
    id: '30000000-0000-4000-8000-000000000003',
    originalFilename: 'synthetic-invoice.pdf',
    extension: 'pdf',
    mimeType: 'application/pdf',
    detectedMimeType: 'application/pdf',
    sizeBytes: 2048,
    createdAt: '2026-07-14T10:00:00.000Z',
  },
};

const invoiceType = {
  key: 'INVOICE',
  label: 'Faktura',
  description: 'Přijatá faktura',
  schemaVersion: 2,
  fields: [
    {
      key: 'supplierName',
      label: 'Dodavatel',
      type: 'STRING',
      required: false,
      maxLength: 200,
      searchable: true,
      filterable: false,
    },
    {
      key: 'purchaseSummary',
      label: 'Čeho se faktura týká',
      type: 'STRING',
      required: false,
      maxLength: 300,
      searchable: true,
      filterable: false,
    },
    {
      key: 'invoiceNumber',
      label: 'Číslo faktury',
      type: 'STRING',
      required: false,
      maxLength: 100,
      searchable: true,
      filterable: false,
    },
    {
      key: 'issueDate',
      label: 'Datum vystavení',
      type: 'DATE',
      required: false,
      searchable: false,
      filterable: true,
    },
    {
      key: 'dueDate',
      label: 'Datum splatnosti',
      type: 'DATE',
      required: false,
      searchable: false,
      filterable: true,
    },
    {
      key: 'totalAmountMinor',
      label: 'Celková částka',
      type: 'MONEY_MINOR',
      required: false,
      searchable: false,
      filterable: true,
    },
    {
      key: 'currencyCode',
      label: 'Měna',
      type: 'CURRENCY',
      required: false,
      searchable: false,
      filterable: true,
      options: ['CZK', 'EUR'],
    },
    {
      key: 'variableSymbol',
      label: 'Variabilní symbol',
      type: 'STRING',
      required: false,
      maxLength: 10,
      searchable: true,
      filterable: false,
    },
    {
      key: 'lineItems',
      label: 'Položky',
      type: 'LINE_ITEMS',
      required: false,
      searchable: false,
      filterable: false,
    },
  ],
};

function listItem(status) {
  const trashed = status === 'TRASHED';
  return {
    id: documentId,
    type: 'INVOICE',
    title: detail.title,
    folder: { id: folderId, name: 'Počítače' },
    status,
    trashedAt: trashed ? '2026-07-15T10:00:00.000Z' : null,
    presentation: {
      primaryLabel: 'Alza.cz',
      secondaryLabel: 'Notebook Lenovo ThinkPad a příslušenství',
      referenceLabel: 'Faktura FV-SYN-2026-77',
      documentDate: '2026-07-14',
      amount: { minorUnits: 3_899_000, currencyCode: 'CZK' },
    },
    canPreview: true,
    permissions: {
      canEdit: !trashed,
      canArchive: status === 'ACTIVE',
      canRestoreArchive: status === 'ARCHIVED',
      canMove: !trashed,
      canMoveToTrash: !trashed,
      canRestoreFromTrash: trashed,
      canPermanentlyDelete: trashed,
    },
    file: {
      id: detail.file.id,
      originalFilename: detail.file.originalFilename,
      extension: 'pdf',
      mimeType: 'application/pdf',
    },
  };
}

function pdfBuffer() {
  const content = 'BT /F1 18 Tf 72 720 Td (Synthetic invoice preview) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${String(Buffer.byteLength(content))} >>\nstream\n${content}\nendstream`,
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(body));
    body += `${String(index + 1)} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${String(objects.length + 1)}\n0000000000 65535 f \n`;
  body += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${String(xref)}\n%%EOF`;
  return Buffer.from(body);
}

async function installApiMock(page, initialStatus = 'ACTIVE') {
  let status = initialStatus;
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    const json = async (body, responseStatus = 200) =>
      route.fulfill({
        status: responseStatus,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: JSON.stringify(body),
      });
    if (path.endsWith('/auth/me'))
      return json({
        user: {
          id: 'user-1',
          email: 'adam@example.test',
          displayName: 'Adam Novák',
          avatarUrl: null,
        },
        activeHousehold: {
          id: 'household-1',
          name: 'Moje domácnost',
          role: 'OWNER',
        },
      });
    if (path.endsWith('/document-folders'))
      return json({
        items: [
          { id: folderId, name: 'Počítače', parentId: null, children: [] },
        ],
      });
    if (path.endsWith('/document-types')) return json({ items: [invoiceType] });
    if (path.endsWith(`/documents/${documentId}/file/preview`))
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: pdfBuffer(),
      });
    if (path.endsWith(`/documents/${documentId}/file/download`))
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: pdfBuffer(),
      });
    if (path.endsWith(`/documents/${documentId}/trash`) && method === 'POST') {
      status = 'TRASHED';
      return json({
        ...detail,
        status,
        trashedAt: '2026-07-15T10:00:00.000Z',
        folder: null,
      });
    }
    if (
      path.endsWith(`/documents/${documentId}/restore-from-trash`) &&
      method === 'POST'
    ) {
      status = 'ACTIVE';
      return json({ ...detail, status });
    }
    if (
      path.endsWith(`/documents/${documentId}/permanent`) &&
      method === 'DELETE'
    ) {
      status = 'DELETED';
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith(`/documents/${documentId}`))
      return json({ ...detail, status });
    if (path.endsWith('/documents/trash')) {
      const items = status === 'TRASHED' ? [listItem('TRASHED')] : [];
      return json({
        items,
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: items.length,
          totalPages: items.length ? 1 : 0,
        },
      });
    }
    if (path.endsWith('/documents')) {
      const items = status === 'ACTIVE' ? [listItem('ACTIVE')] : [];
      return json({
        items,
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: items.length,
          totalPages: items.length ? 1 : 0,
        },
      });
    }
    return json(
      { statusCode: 404, code: 'NOT_FOUND', message: 'Nenalezeno.' },
      404,
    );
  });
}

async function preparePage(browser, viewport, theme) {
  const context = await browser.newContext({ viewport, locale: 'cs-CZ' });
  await context.addInitScript(
    (value) => localStorage.setItem('homeapp.theme', value),
    theme,
  );
  const page = await context.newPage();
  await installApiMock(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  return { context, page };
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const desktop = await preparePage(
    browser,
    { width: 1440, height: 900 },
    'dark',
  );
  await desktop.page.goto('http://127.0.0.1:5173/app/documents');
  await desktop.page.getByText('Alza.cz', { exact: true }).waitFor();
  if (await desktop.page.getByText('Velikost', { exact: true }).count())
    throw new Error('Technický sloupec Velikost je viditelný.');
  if (await desktop.page.getByText('Stav', { exact: true }).count())
    throw new Error('Technický sloupec Stav je viditelný.');
  await desktop.page.screenshot({
    path: `${outputDirectory}/documents-desktop-dark.png`,
    fullPage: true,
  });
  await desktop.page.getByRole('button', { name: 'Náhled: Alza.cz' }).click();
  await desktop.page
    .getByRole('dialog', { name: 'Faktura za notebook' })
    .waitFor();
  await desktop.page.screenshot({
    path: `${outputDirectory}/preview-desktop-dark.png`,
  });
  await desktop.page.getByRole('button', { name: 'Zavřít dialog' }).click();
  await desktop.page
    .getByRole('button', { name: 'Další akce: Alza.cz' })
    .click();
  await desktop.page.getByRole('menuitem', { name: 'Upravit údaje' }).click();
  await desktop.page
    .getByRole('dialog', { name: 'Upravit údaje dokumentu' })
    .waitFor();
  await desktop.page.screenshot({
    path: `${outputDirectory}/metadata-dialog-desktop-dark.png`,
  });
  await desktop.page.getByRole('button', { name: 'Zavřít dialog' }).click();
  await desktop.page
    .getByRole('button', { name: 'Další akce: Alza.cz' })
    .click();
  await desktop.page
    .getByRole('menuitem', { name: 'Přesunout do koše' })
    .click();
  await desktop.page.getByRole('button', { name: 'Přesunout do koše' }).click();
  await desktop.page.getByRole('link', { name: 'Koš', exact: true }).click();
  await desktop.page.getByText('Alza.cz', { exact: true }).waitFor();
  await desktop.page.screenshot({
    path: `${outputDirectory}/trash-desktop-dark.png`,
    fullPage: true,
  });
  await desktop.page
    .getByRole('button', { name: 'Další akce: Alza.cz' })
    .click();
  await desktop.page.getByRole('menuitem', { name: 'Obnovit z koše' }).click();
  await desktop.page.getByRole('button', { name: 'Obnovit z koše' }).click();
  await desktop.page.getByText('Koš je prázdný').waitFor();
  await desktop.page
    .getByRole('navigation', { name: 'Pohled dokumentů' })
    .getByRole('link', { name: 'Dokumenty', exact: true })
    .click();
  await desktop.page.getByText('Alza.cz', { exact: true }).waitFor();
  await desktop.page
    .getByRole('button', { name: 'Další akce: Alza.cz' })
    .click();
  await desktop.page
    .getByRole('menuitem', { name: 'Přesunout do koše' })
    .click();
  await desktop.page.getByRole('button', { name: 'Přesunout do koše' }).click();
  await desktop.page.getByRole('link', { name: 'Koš', exact: true }).click();
  await desktop.page.getByText('Alza.cz', { exact: true }).waitFor();
  await desktop.page
    .getByRole('button', { name: 'Další akce: Alza.cz' })
    .click();
  await desktop.page
    .getByRole('menuitem', { name: 'Trvale odstranit' })
    .click();
  await desktop.page.getByLabel('Pro potvrzení napište SMAZAT').fill('SMAZAT');
  await desktop.page.screenshot({
    path: `${outputDirectory}/permanent-delete-confirmation-dark.png`,
  });
  await desktop.page.getByRole('button', { name: 'Trvale odstranit' }).click();
  await desktop.page.getByText('Koš je prázdný').waitFor();
  await desktop.context.close();

  const mobile = await preparePage(
    browser,
    { width: 390, height: 844 },
    'light',
  );
  await mobile.page.goto('http://127.0.0.1:5173/app/documents');
  await mobile.page.getByRole('list', { name: 'Seznam dokumentů' }).waitFor();
  const overflow = await mobile.page.evaluate(
    () =>
      globalThis.document.documentElement.scrollWidth >
      globalThis.document.documentElement.clientWidth,
  );
  if (overflow) throw new Error('Mobilní seznam má horizontální overflow.');
  await mobile.page.screenshot({
    path: `${outputDirectory}/documents-mobile-light.png`,
    fullPage: true,
  });
  await mobile.page
    .getByRole('button', { name: 'Náhled', exact: true })
    .click();
  const dialog = mobile.page.getByRole('dialog', {
    name: 'Faktura za notebook',
  });
  await dialog.waitFor();
  const box = await dialog.boundingBox();
  if (!box || box.width < 389 || box.height < 843)
    throw new Error('Mobilní preview není full-screen.');
  await mobile.page.screenshot({
    path: `${outputDirectory}/preview-mobile-light.png`,
  });
  await mobile.context.close();
} finally {
  await browser.close();
}

process.stdout.write(`${outputDirectory}\n`);
