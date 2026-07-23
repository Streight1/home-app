import type { FinancialTransaction } from '../../types/finance.types.js';

export const financialTransactionLabel = (transaction: FinancialTransaction) =>
  transaction.type.startsWith('TRANSFER') && transaction.transfer
    ? `Převod · ${transaction.transfer.fromAccountName} → ${transaction.transfer.toAccountName}`
    : (transaction.counterpartyName ?? transaction.description ?? 'Bez popisu');

export const financialTransactionTypeLabel = (
  transaction: FinancialTransaction,
) => {
  if (transaction.type === 'EXPENSE') return 'Výdaj';
  if (transaction.type === 'INCOME') return 'Příjem';
  if (transaction.type === 'TRANSFER_OUT') return 'Převod z účtu';
  if (transaction.type === 'TRANSFER_IN') return 'Převod na účet';
  return 'Úprava zůstatku';
};
