export type FinanceCurrency = 'CZK' | 'EUR';
export type FinancialAccountType =
  | 'CURRENT'
  | 'SAVINGS'
  | 'CREDIT_CARD'
  | 'CASH'
  | 'OTHER';
export type FinancialCategoryKind = 'EXPENSE' | 'INCOME' | 'BOTH';
export type FinancialTransactionType =
  | 'EXPENSE'
  | 'INCOME'
  | 'REFUND'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT';

export interface MoneyValue {
  amountMinor: string;
  currencyCode: FinanceCurrency;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: FinancialAccountType;
  currencyCode: FinanceCurrency;
  openingBalanceMinor: string;
  openingBalanceDate: string;
  currentBalanceMinor: string;
  description: string | null;
  colorToken: string;
  iconKey: string;
  archivedAt: string | null;
  transactionCount?: number;
  creditLimitMinor?: string | null;
  statementDayOfMonth?: number | null;
  paymentDueDayOfMonth?: number | null;
  maskedIdentifier?: string | null;
  currentDebtMinor?: string | null;
  availableCreditMinor?: string | null;
}

export interface FinancialCategory {
  id: string;
  parentId: string | null;
  name: string;
  kind: FinancialCategoryKind;
  colorToken: string;
  iconKey: string;
  sortOrder: number;
  archivedAt: string | null;
}

export interface SafeFinanceDocument {
  id: string;
  type: string;
  primaryLabel: string;
  canPreview: boolean;
}

export interface FinancialTransaction {
  id: string;
  type: FinancialTransactionType;
  source: 'MANUAL' | 'CSV_IMPORT' | 'BANK_API';
  amount: MoneyValue;
  bookedDate: string;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  description: string | null;
  variableSymbol: string | null;
  constantSymbol: string | null;
  specificSymbol: string | null;
  note: string | null;
  account: { id: string; name: string; colorToken: string; iconKey: string };
  category: {
    id: string;
    name: string;
    colorToken: string;
    iconKey: string;
  } | null;
  transfer: {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    fromAccountName: string;
    toAccountName: string;
  } | null;
  documents: SafeFinanceDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface FinanceListState {
  page: number;
  pageSize: 10 | 20 | 50 | 100;
  query: string;
  accountId?: string | undefined;
  categoryId?: string | undefined;
  type?: FinancialTransactionType | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  amountFromMinor?: string | undefined;
  amountToMinor?: string | undefined;
  documentLinked?: boolean | undefined;
  sortBy: 'bookedDate' | 'amountMinor' | 'createdAt' | 'counterpartyName';
  sortDirection: 'asc' | 'desc';
}

export interface FinancialTransactionInput {
  accountId: string;
  categoryId: string | null;
  amountMinor: string;
  bookedDate: string;
  counterpartyName: string | null;
  description: string | null;
  variableSymbol: string | null;
  note: string | null;
  documentIds: string[];
}

export interface FinancialTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amountMinor: string;
  bookedDate: string;
  note: string | null;
}

export interface FinanceSummary {
  period: { dateFrom: string; dateTo: string };
  currencies: {
    currencyCode: FinanceCurrency;
    incomeMinor: string;
    expenseMinor: string;
    netMinor: string;
    uncategorizedExpenseCount: number;
    topExpenseCategory?: {
      categoryId: string;
      name: string;
      amountMinor: string;
      shareBasisPoints: number;
    } | null;
    topExpenseCategories?: {
      categoryId: string;
      name: string;
      amountMinor: string;
      shareBasisPoints: number;
    }[];
  }[];
  accounts: {
    id: string;
    name: string;
    currencyCode: FinanceCurrency;
    currentBalanceMinor: string;
    archived: boolean;
  }[];
}

export interface FinanceAnalyticsDashboard {
  period: { dateFrom: string; dateTo: string };
  currencies: {
    currencyCode: FinanceCurrency;
    incomeMinor: string;
    expenseMinor: string;
    netMinor: string;
    previousExpenseMinor: string;
    expenseChangeMinor: string;
    expenseChangeBasisPoints: number | null;
    uncategorizedCount: number;
    topCategory: {
      categoryId: string | null;
      name: string;
      amountMinor: string;
    } | null;
    trend: {
      period: string;
      incomeMinor: string;
      expenseMinor: string;
      netMinor: string;
    }[];
  }[];
}
