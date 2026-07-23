import { financeInvalid } from './finance.errors.js';
import type { ManualTransactionType } from './finance.types.js';

export interface LedgerAmount {
  type:
    | 'EXPENSE'
    | 'INCOME'
    | 'REFUND'
    | 'TRANSFER_OUT'
    | 'TRANSFER_IN'
    | 'ADJUSTMENT';
  amountMinor: bigint;
}

export const calculateAccountBalance = (
  openingBalanceMinor: bigint,
  transactions: readonly LedgerAmount[],
): bigint =>
  transactions.reduce((balance, transaction) => {
    if (
      ['INCOME', 'REFUND', 'TRANSFER_IN', 'ADJUSTMENT'].includes(
        transaction.type,
      )
    ) {
      return balance + transaction.amountMinor;
    }
    return balance - transaction.amountMinor;
  }, openingBalanceMinor);

export const isCategoryKindAllowed = (
  categoryKind: 'EXPENSE' | 'INCOME' | 'BOTH',
  transactionType: ManualTransactionType,
): boolean => categoryKind === 'BOTH' || categoryKind === transactionType;

export const validateTransferAccounts = (
  from: { id: string; currencyCode: string; archivedAt: Date | null },
  to: { id: string; currencyCode: string; archivedAt: Date | null },
): string => {
  if (from.id === to.id)
    throw financeInvalid('Zdrojový a cílový účet musí být rozdílný.');
  if (from.archivedAt || to.archivedAt) {
    throw financeInvalid('Archivovaný účet nelze použít pro převod.');
  }
  if (from.currencyCode !== to.currencyCode) {
    throw financeInvalid('Převod je možný pouze mezi účty ve stejné měně.');
  }
  return from.currencyCode;
};
