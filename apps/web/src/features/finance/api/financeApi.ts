import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  FinanceListState,
  FinanceAnalyticsDashboard,
  FinanceSummary,
  FinancialAccount,
  FinancialCategory,
  FinancialTransaction,
  FinancialTransactionInput,
  FinancialTransferInput,
} from '../types/finance.types.js';

function queryString(
  input: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value !== undefined && value !== '') query.set(key, String(value));
  return query.toString();
}

export const getFinancialAccounts = (includeArchived = false) =>
  apiRequest<{ items: FinancialAccount[] }>(
    `/finance/accounts?${queryString({ includeArchived })}`,
  );

export const createFinancialAccount = (input: {
  name: string;
  type: string;
  currencyCode: string;
  openingBalanceMinor: string;
  openingBalanceDate: string;
  description: string | null;
  colorToken: string;
  iconKey: string;
  creditLimitMinor?: string | null;
  statementDayOfMonth?: number | null;
  paymentDueDayOfMonth?: number | null;
  maskedIdentifier?: string | null;
}) =>
  apiRequest<FinancialAccount>('/finance/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateFinancialAccount = (
  id: string,
  input: Partial<{
    name: string;
    type: string;
    currencyCode: string;
    openingBalanceMinor: string;
    openingBalanceDate: string;
    description: string | null;
    colorToken: string;
    iconKey: string;
    creditLimitMinor: string | null;
    statementDayOfMonth: number | null;
    paymentDueDayOfMonth: number | null;
    maskedIdentifier: string | null;
  }>,
) =>
  apiRequest<FinancialAccount>(`/finance/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const setFinancialAccountArchived = (id: string, archived: boolean) =>
  apiRequest<FinancialAccount>(
    `/finance/accounts/${id}/${archived ? 'archive' : 'restore'}`,
    { method: 'POST' },
  );

export const getFinancialCategories = (includeArchived = false) =>
  apiRequest<{ items: FinancialCategory[] }>(
    `/finance/categories?${queryString({ includeArchived })}`,
  );

export const createFinancialCategory = (input: {
  name: string;
  kind: string;
  parentId: string | null;
  colorToken: string;
  iconKey: string;
  sortOrder: number;
}) =>
  apiRequest<{ id: string }>('/finance/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateFinancialCategory = (
  id: string,
  input: Partial<{
    name: string;
    kind: string;
    parentId: string | null;
    colorToken: string;
    iconKey: string;
    sortOrder: number;
  }>,
) =>
  apiRequest<{ id: string }>(`/finance/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const archiveFinancialCategory = (id: string) =>
  apiRequest<{ id: string }>(`/finance/categories/${id}/archive`, {
    method: 'POST',
  });

export const createRecommendedCategories = () =>
  apiRequest<{ createdCount: number }>('/finance/categories/recommended', {
    method: 'POST',
  });

export const getFinancialTransactions = (state: FinanceListState) =>
  apiRequest<{
    items: FinancialTransaction[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }>(
    `/finance/transactions?${queryString({
      page: state.page,
      pageSize: state.pageSize,
      query: state.query,
      accountId: state.accountId,
      categoryId: state.categoryId,
      type: state.type,
      dateFrom: state.dateFrom,
      dateTo: state.dateTo,
      amountFromMinor: state.amountFromMinor,
      amountToMinor: state.amountToMinor,
      documentLinked: state.documentLinked,
      sortBy: state.sortBy,
      sortDirection: state.sortDirection,
    })}`,
  );

export const getFinancialTransaction = (id: string) =>
  apiRequest<FinancialTransaction>(`/finance/transactions/${id}`);

export const createFinancialTransaction = (
  type: 'expense' | 'income',
  input: FinancialTransactionInput,
) =>
  apiRequest<FinancialTransaction>(`/finance/transactions/${type}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateFinancialTransaction = (
  id: string,
  input: Partial<FinancialTransactionInput>,
) =>
  apiRequest<FinancialTransaction>(`/finance/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const deleteFinancialTransaction = (id: string) =>
  apiRequest<undefined>(`/finance/transactions/${id}`, { method: 'DELETE' });

export const createFinancialTransfer = (input: FinancialTransferInput) =>
  apiRequest<{ id: string }>('/finance/transfers', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateFinancialTransfer = (
  id: string,
  input: FinancialTransferInput,
) =>
  apiRequest<{ id: string }>(`/finance/transfers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const deleteFinancialTransfer = (id: string) =>
  apiRequest<undefined>(`/finance/transfers/${id}`, { method: 'DELETE' });

export const getFinanceSummary = (period?: {
  dateFrom?: string;
  dateTo?: string;
}) =>
  apiRequest<FinanceSummary>(
    `/finance/summary?${queryString({
      dateFrom: period?.dateFrom,
      dateTo: period?.dateTo,
    })}`,
  );
export const getFinanceDashboard = () =>
  apiRequest<FinanceAnalyticsDashboard>('/finance/analytics/dashboard');
