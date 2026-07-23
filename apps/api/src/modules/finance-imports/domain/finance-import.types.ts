export const financeImportEncodings = ['utf-8', 'windows-1250'] as const;
export const financeImportDateFormats = [
  'YYYY-MM-DD',
  'DD.MM.YYYY',
  'D.M.YYYY',
  'DD/MM/YYYY',
] as const;
export const financeAmountColumnModes = [
  'SIGNED_AMOUNT',
  'SEPARATE_DEBIT_CREDIT',
  'TRANSACTION_TYPE_AND_AMOUNT',
] as const;
export const financeImportFields = [
  'externalTransactionId',
  'bookedDate',
  'transactionDate',
  'signedAmount',
  'debitAmount',
  'creditAmount',
  'currencyCode',
  'transactionType',
  'counterpartyName',
  'counterpartyAccount',
  'description',
  'variableSymbol',
  'constantSymbol',
  'specificSymbol',
] as const;

export type FinanceImportField = (typeof financeImportFields)[number];
export type FinanceImportColumnMapping = Partial<
  Record<FinanceImportField, string>
>;

export interface CsvFormatSettings {
  encoding: (typeof financeImportEncodings)[number];
  delimiter: ',' | ';' | '\t';
  quoteCharacter: '"';
  hasHeader: boolean;
  headerRowNumber: number;
  skipRowsBefore: number;
  dateFormat: (typeof financeImportDateFormats)[number];
  decimalSeparator: ',' | '.';
  thousandSeparator: '' | ' ' | '.' | ',';
}

export interface ImportMappingSettings {
  amountColumnMode: (typeof financeAmountColumnModes)[number];
  columnMapping: FinanceImportColumnMapping;
  invertAmountSign: boolean;
  defaultCurrencyCode: 'CZK' | 'EUR' | null;
}

export interface NormalizedImportRow {
  rowNumber: number;
  status: 'VALID' | 'INVALID' | 'POSSIBLE_DUPLICATE' | 'NEEDS_TRANSFER_REVIEW';
  externalTransactionId: string | null;
  bookedDate: Date | null;
  transactionDate: Date | null;
  amountMinor: bigint | null;
  currencyCode: string | null;
  transactionType: 'EXPENSE' | 'INCOME' | 'REFUND' | null;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  description: string | null;
  variableSymbol: string | null;
  constantSymbol: string | null;
  specificSymbol: string | null;
  merchantNormalizedName: string | null;
  categoryId: string | null;
  fingerprint: string | null;
  duplicateTransactionId: string | null;
  validationErrors: string[];
  userIncluded: boolean;
}
