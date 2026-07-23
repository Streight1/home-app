import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bulkCategoryFinanceImportRows,
  cancelFinanceImport,
  commitFinanceImport,
  configureFinanceImportFormat,
  configureFinanceImportMapping,
  createFinanceImport,
  getFinanceImportHistory,
  getFinanceImportPreview,
  getFinanceImportProfiles,
  updateFinanceImportRow,
} from '../api/financeImportsApi.js';

export const FINANCE_IMPORTS_QUERY_KEY = ['finance-imports'] as const;
export const useFinanceImportHistory = () =>
  useQuery({
    queryKey: [...FINANCE_IMPORTS_QUERY_KEY, 'history'],
    queryFn: getFinanceImportHistory,
  });
export const useFinanceImportProfiles = () =>
  useQuery({
    queryKey: [...FINANCE_IMPORTS_QUERY_KEY, 'profiles'],
    queryFn: getFinanceImportProfiles,
  });
export const useFinanceImportPreview = (id: string | null, page: number) =>
  useQuery({
    queryKey: [...FINANCE_IMPORTS_QUERY_KEY, id, 'preview', page],
    queryFn: () => getFinanceImportPreview(requireImportId(id), page),
    enabled: Boolean(id),
  });

export function useFinanceImportMutations() {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: FINANCE_IMPORTS_QUERY_KEY });
  return {
    create: useMutation({
      mutationFn: (input: Parameters<typeof createFinanceImport>) =>
        createFinanceImport(...input),
    }),
    format: useMutation({
      mutationFn: (input: {
        id: string;
        data: Parameters<typeof configureFinanceImportFormat>[1];
      }) => configureFinanceImportFormat(input.id, input.data),
    }),
    mapping: useMutation({
      mutationFn: (input: {
        id: string;
        data: Parameters<typeof configureFinanceImportMapping>[1];
      }) => configureFinanceImportMapping(input.id, input.data),
      onSuccess: refresh,
    }),
    updateRow: useMutation({
      mutationFn: (input: {
        importId: string;
        rowId: string;
        data: Parameters<typeof updateFinanceImportRow>[2];
      }) => updateFinanceImportRow(input.importId, input.rowId, input.data),
      onSuccess: refresh,
    }),
    bulkCategory: useMutation({
      mutationFn: (input: {
        importId: string;
        rowIds: string[];
        categoryId: string;
      }) =>
        bulkCategoryFinanceImportRows(
          input.importId,
          input.rowIds,
          input.categoryId,
        ),
      onSuccess: refresh,
    }),
    commit: useMutation({
      mutationFn: (input: {
        id: string;
        duplicates: boolean;
        repeated: boolean;
      }) => commitFinanceImport(input.id, input.duplicates, input.repeated),
      onSuccess: refresh,
    }),
    cancel: useMutation({
      mutationFn: cancelFinanceImport,
      onSuccess: refresh,
    }),
  };
}

function requireImportId(id: string | null): string {
  if (!id) throw new Error('Importní session není vybraná.');
  return id;
}
