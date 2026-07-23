import type { Prisma } from '../../../generated/prisma/client.js';

export const includeFinancialTransaction = {
  account: true,
  category: true,
  documents: { select: { documentId: true } },
  transfer: {
    select: {
      id: true,
      fromAccountId: true,
      toAccountId: true,
      fromAccount: { select: { name: true } },
      toAccount: { select: { name: true } },
    },
  },
} satisfies Prisma.FinancialTransactionInclude;

export type FinancialTransactionRecord = Prisma.FinancialTransactionGetPayload<{
  include: typeof includeFinancialTransaction;
}>;
