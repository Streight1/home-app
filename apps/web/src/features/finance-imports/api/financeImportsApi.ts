import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  ImportFormat,
  ImportMapping,
  ImportPreview,
  ImportProfile,
  ImportSession,
  ImportSourceKind,
} from '../types/finance-import.types.js';

export async function createFinanceImport(
  accountId: string,
  sourceKind: ImportSourceKind,
  file: File,
) {
  const body = new FormData();
  body.set('accountId', accountId);
  body.set('sourceKind', sourceKind);
  body.set('file', file);
  return apiRequest<ImportSession>('/finance/imports', {
    method: 'POST',
    body,
  });
}
export const configureFinanceImportFormat = (id: string, input: ImportFormat) =>
  apiRequest<{ importId: string; sample: Record<string, string>[] }>(
    `/finance/imports/${id}/format`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
export const configureFinanceImportMapping = (
  id: string,
  input: ImportMapping,
) =>
  apiRequest<{
    importId: string;
    status: string;
    counts: Record<string, number>;
  }>(`/finance/imports/${id}/mapping`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
export const getFinanceImportPreview = (id: string, page = 1) =>
  apiRequest<ImportPreview>(
    `/finance/imports/${id}/preview?page=${String(page)}&pageSize=20`,
  );
export const updateFinanceImportRow = (
  importId: string,
  rowId: string,
  input: {
    userIncluded?: boolean;
    categoryId?: string | null;
    transactionType?: 'EXPENSE' | 'INCOME' | 'REFUND' | 'TRANSFER_IN';
    transferSourceAccountId?: string | null;
    matchingTransactionId?: string | null;
  },
) =>
  apiRequest<{ id: string }>(`/finance/imports/${importId}/rows/${rowId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
export const bulkCategoryFinanceImportRows = (
  importId: string,
  rowIds: string[],
  categoryId: string,
) =>
  apiRequest<{ updatedCount: number }>(`/finance/imports/${importId}/rows`, {
    method: 'PATCH',
    body: JSON.stringify({ rowIds, categoryId }),
  });
export const commitFinanceImport = (
  id: string,
  confirmPossibleDuplicates: boolean,
  confirmRepeatedFile: boolean,
) =>
  apiRequest<{ importId: string; status: string; importedRowCount: number }>(
    `/finance/imports/${id}/commit`,
    {
      method: 'POST',
      body: JSON.stringify({ confirmPossibleDuplicates, confirmRepeatedFile }),
    },
  );
export const cancelFinanceImport = (id: string) =>
  apiRequest<undefined>(`/finance/imports/${id}/cancel`, { method: 'POST' });
export const getFinanceImportHistory = () =>
  apiRequest<{ items: ImportSession[] }>('/finance/imports?page=1&pageSize=20');
export const getFinanceImportProfiles = () =>
  apiRequest<{ items: ImportProfile[] }>('/finance/import-profiles');
