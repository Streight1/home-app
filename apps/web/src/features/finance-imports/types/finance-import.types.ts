export type ImportStep = 'file' | 'format' | 'mapping' | 'preview' | 'result';
export type ImportSourceKind = 'BANK_ACCOUNT' | 'CREDIT_CARD';
export type AmountColumnMode =
  | 'SIGNED_AMOUNT'
  | 'SEPARATE_DEBIT_CREDIT'
  | 'TRANSACTION_TYPE_AND_AMOUNT';

export interface ImportSession {
  id: string;
  status: string;
  sourceKind: ImportSourceKind;
  originalFilename: string;
  fileSizeBytes: string;
  repeatedFile?: boolean;
  account: { id: string; name: string; type: string; currencyCode?: string };
  detectedFormat?: {
    encoding: 'utf-8' | 'windows-1250';
    delimiter: ',' | ';' | '\t';
    hasHeader?: boolean;
    headerRowNumber?: number;
    sampleRows?: string[][];
  };
  counts?: {
    total: number;
    valid: number;
    invalid: number;
    possibleDuplicates: number;
    ignored: number;
    imported: number;
  };
}

export interface ImportFormat {
  encoding: 'utf-8' | 'windows-1250';
  delimiter: ',' | ';' | '\t';
  quoteCharacter: '"';
  hasHeader: boolean;
  headerRowNumber: number;
  skipRowsBefore: number;
  dateFormat: 'YYYY-MM-DD' | 'DD.MM.YYYY' | 'D.M.YYYY' | 'DD/MM/YYYY';
  decimalSeparator: ',' | '.';
  thousandSeparator: '' | ' ' | '.' | ',';
}

export interface ImportMapping {
  amountColumnMode: AmountColumnMode;
  columnMapping: Record<string, string>;
  invertAmountSign: boolean;
  defaultCurrencyCode: 'CZK' | 'EUR' | null;
  saveProfileName?: string | undefined;
  profileId?: string | null | undefined;
}

export interface ImportPreviewRow {
  id: string;
  rowNumber: number;
  status:
    | 'VALID'
    | 'INVALID'
    | 'POSSIBLE_DUPLICATE'
    | 'NEEDS_TRANSFER_REVIEW'
    | 'IMPORTED'
    | 'SKIPPED';
  bookedDate: string | null;
  amountMinor: string | null;
  currencyCode: 'CZK' | 'EUR' | null;
  transactionType: string | null;
  counterpartyName: string | null;
  description: string | null;
  categoryId: string | null;
  transferSourceAccountId: string | null;
  matchingTransactionId: string | null;
  userIncluded: boolean;
  validationErrorsJson: string[];
}

export interface ImportPreview {
  session: ImportSession;
  items: ImportPreviewRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ImportProfile {
  id: string;
  name: string;
  accountId: string | null;
  sourceKind: ImportSourceKind;
  encoding: ImportFormat['encoding'];
  delimiter: ImportFormat['delimiter'];
  quoteCharacter: '"';
  hasHeader: boolean;
  headerRowNumber: number;
  skipRowsBefore: number;
  dateFormat: ImportFormat['dateFormat'];
  decimalSeparator: ImportFormat['decimalSeparator'];
  thousandSeparator: ImportFormat['thousandSeparator'];
  amountColumnMode: AmountColumnMode;
  columnMappingJson: Record<string, string>;
  invertAmountSign: boolean;
  defaultCurrencyCode: 'CZK' | 'EUR' | null;
}
