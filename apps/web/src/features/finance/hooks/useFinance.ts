import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createFinancialAccount,
  createFinancialCategory,
  createFinancialTransaction,
  createFinancialTransfer,
  createRecommendedCategories,
  archiveFinancialCategory,
  deleteFinancialTransaction,
  deleteFinancialTransfer,
  getFinanceDashboard,
  getFinanceSummary,
  getFinancialAccounts,
  getFinancialCategories,
  getFinancialTransaction,
  getFinancialTransactions,
  updateFinancialTransaction,
  updateFinancialTransfer,
  updateFinancialAccount,
  updateFinancialCategory,
  setFinancialAccountArchived,
} from '../api/financeApi.js';
import type {
  FinanceListState,
  FinancialTransactionInput,
  FinancialTransferInput,
} from '../types/finance.types.js';

export const FINANCE_QUERY_KEY = ['finance'] as const;

export const useFinancialAccounts = (includeArchived = false) =>
  useQuery({
    queryKey: [...FINANCE_QUERY_KEY, 'accounts', includeArchived],
    queryFn: () => getFinancialAccounts(includeArchived),
  });

export const useFinancialCategories = (includeArchived = false) =>
  useQuery({
    queryKey: [...FINANCE_QUERY_KEY, 'categories', includeArchived],
    queryFn: () => getFinancialCategories(includeArchived),
  });

export const useFinancialTransactions = (state: FinanceListState) =>
  useQuery({
    queryKey: [...FINANCE_QUERY_KEY, 'transactions', state],
    queryFn: () => getFinancialTransactions(state),
    placeholderData: keepPreviousData,
  });

export const useFinancialTransaction = (id: string) =>
  useQuery({
    queryKey: [...FINANCE_QUERY_KEY, 'transaction', id],
    queryFn: () => getFinancialTransaction(id),
  });

export const useFinanceSummary = (period?: {
  dateFrom?: string;
  dateTo?: string;
}) =>
  useQuery({
    queryKey: [...FINANCE_QUERY_KEY, 'summary', period],
    queryFn: () => getFinanceSummary(period),
  });

export const useFinanceDashboard = () =>
  useQuery({
    queryKey: [...FINANCE_QUERY_KEY, 'dashboard'],
    queryFn: getFinanceDashboard,
  });

export function useFinanceMutations() {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: FINANCE_QUERY_KEY });
  return {
    createTransaction: useMutation({
      mutationFn: (input: {
        type: 'expense' | 'income';
        data: FinancialTransactionInput;
      }) => createFinancialTransaction(input.type, input.data),
      onSuccess: refresh,
    }),
    updateTransaction: useMutation({
      mutationFn: (input: {
        id: string;
        data: Partial<FinancialTransactionInput>;
      }) => updateFinancialTransaction(input.id, input.data),
      onSuccess: refresh,
    }),
    deleteTransaction: useMutation({
      mutationFn: deleteFinancialTransaction,
      onSuccess: refresh,
    }),
    createTransfer: useMutation({
      mutationFn: (input: FinancialTransferInput) =>
        createFinancialTransfer(input),
      onSuccess: refresh,
    }),
    updateTransfer: useMutation({
      mutationFn: (input: { id: string; data: FinancialTransferInput }) =>
        updateFinancialTransfer(input.id, input.data),
      onSuccess: refresh,
    }),
    deleteTransfer: useMutation({
      mutationFn: deleteFinancialTransfer,
      onSuccess: refresh,
    }),
    createAccount: useMutation({
      mutationFn: createFinancialAccount,
      onSuccess: refresh,
    }),
    updateAccount: useMutation({
      mutationFn: (input: {
        id: string;
        data: Parameters<typeof updateFinancialAccount>[1];
      }) => updateFinancialAccount(input.id, input.data),
      onSuccess: refresh,
    }),
    setAccountArchived: useMutation({
      mutationFn: (input: { id: string; archived: boolean }) =>
        setFinancialAccountArchived(input.id, input.archived),
      onSuccess: refresh,
    }),
    createCategory: useMutation({
      mutationFn: createFinancialCategory,
      onSuccess: refresh,
    }),
    updateCategory: useMutation({
      mutationFn: (input: {
        id: string;
        data: Parameters<typeof updateFinancialCategory>[1];
      }) => updateFinancialCategory(input.id, input.data),
      onSuccess: refresh,
    }),
    archiveCategory: useMutation({
      mutationFn: archiveFinancialCategory,
      onSuccess: refresh,
    }),
    recommendedCategories: useMutation({
      mutationFn: createRecommendedCategories,
      onSuccess: refresh,
    }),
  };
}
