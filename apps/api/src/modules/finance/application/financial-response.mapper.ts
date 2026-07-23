import type { SafeDocumentSummary } from '../../documents/documents.facade.js';
import { dateOnlyString } from '../domain/finance.types.js';
import type { FinancialTransactionRecord } from '../infrastructure/financial-transaction-record.js';

export const mapFinancialTransaction = (
  transaction: FinancialTransactionRecord,
  documentById: ReadonlyMap<string, SafeDocumentSummary>,
) => ({
  id: transaction.id,
  type: transaction.type,
  source: transaction.source,
  amount: {
    amountMinor: transaction.amountMinor.toString(),
    currencyCode: transaction.currencyCode,
  },
  bookedDate: dateOnlyString(transaction.bookedDate),
  counterpartyName: transaction.counterpartyName,
  counterpartyAccount: transaction.counterpartyAccount,
  description: transaction.description,
  variableSymbol: transaction.variableSymbol,
  constantSymbol: transaction.constantSymbol,
  specificSymbol: transaction.specificSymbol,
  note: transaction.note,
  account: {
    id: transaction.account.id,
    name: transaction.account.name,
    colorToken: transaction.account.colorToken,
    iconKey: transaction.account.iconKey,
  },
  category: transaction.category
    ? {
        id: transaction.category.id,
        name: transaction.category.name,
        colorToken: transaction.category.colorToken,
        iconKey: transaction.category.iconKey,
      }
    : null,
  transfer: transaction.transfer
    ? {
        id: transaction.transfer.id,
        fromAccountId: transaction.transfer.fromAccountId,
        toAccountId: transaction.transfer.toAccountId,
        fromAccountName: transaction.transfer.fromAccount.name,
        toAccountName: transaction.transfer.toAccount.name,
      }
    : null,
  documents: transaction.documents.flatMap(({ documentId }) => {
    const document = documentById.get(documentId);
    return document ? [document] : [];
  }),
  createdAt: transaction.createdAt.toISOString(),
  updatedAt: transaction.updatedAt.toISOString(),
});
