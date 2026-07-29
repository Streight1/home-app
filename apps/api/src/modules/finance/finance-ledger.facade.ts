import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { HouseholdAccessService } from '../households/household-access.service.js';
import {
  FINANCE_READ_ROLE,
  FINANCE_WRITE_ROLE,
} from './domain/finance-access.policy.js';
import { financeInvalid, financeNotFound } from './domain/finance.errors.js';
import { dateOnlyString } from './domain/finance.types.js';

export interface ImportedLedgerRow {
  importRowId: string;
  type: 'EXPENSE' | 'INCOME' | 'REFUND';
  amountMinor: bigint;
  currencyCode: string;
  bookedDate: Date;
  transactionDate: Date | null;
  externalTransactionId: string | null;
  fingerprint: string;
  merchantNormalizedName: string | null;
  categoryId: string | null;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  description: string | null;
  variableSymbol: string | null;
  constantSymbol: string | null;
  specificSymbol: string | null;
}

export interface FinanceAccountSummary {
  id: string;
  householdId: string;
  name: string;
  type: 'CURRENT' | 'SAVINGS' | 'CREDIT_CARD' | 'CASH' | 'OTHER';
  currencyCode: string;
  archived: boolean;
}

export interface ImportedCardRepaymentRow {
  importRowId: string;
  amountMinor: bigint;
  currencyCode: string;
  bookedDate: Date;
  externalTransactionId: string | null;
  fingerprint: string;
  sourceAccountId: string;
  matchingTransactionId: string | null;
}

@Injectable()
export class FinanceLedgerFacade {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
  ) {}

  public async getAccount(
    userId: string,
    accountId: string,
    writable = false,
  ): Promise<FinanceAccountSummary> {
    const membership = await this.access.getActiveMembership(
      userId,
      writable ? FINANCE_WRITE_ROLE : FINANCE_READ_ROLE,
    );
    const account = await this.prisma.financialAccount.findFirst({
      where: { id: accountId, householdId: membership.householdId },
      select: {
        id: true,
        householdId: true,
        name: true,
        type: true,
        currencyCode: true,
        archivedAt: true,
      },
    });
    if (!account) throw financeNotFound();
    if (writable && account.archivedAt)
      throw financeInvalid('Archivovaný účet nelze použít pro import.');
    return {
      id: account.id,
      householdId: account.householdId,
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      archived: account.archivedAt !== null,
    };
  }

  public async getAccountForCurrentHousehold(userId: string, writable = false) {
    const membership = await this.access.getActiveMembership(
      userId,
      writable ? FINANCE_WRITE_ROLE : FINANCE_READ_ROLE,
    );
    return { householdId: membership.householdId };
  }

  public async verifyCategory(
    userId: string,
    categoryId: string,
    transactionType: 'EXPENSE' | 'INCOME' | 'REFUND',
  ): Promise<void> {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const category = await this.prisma.financialCategory.findFirst({
      where: { id: categoryId, householdId: membership.householdId },
      select: { kind: true, archivedAt: true },
    });
    if (!category || category.archivedAt) throw financeNotFound();
    const expected = transactionType === 'INCOME' ? 'INCOME' : 'EXPENSE';
    if (category.kind !== 'BOTH' && category.kind !== expected) {
      throw financeInvalid('Kategorie neodpovídá typu transakce.');
    }
  }

  public async findDuplicateCandidates(
    userId: string,
    accountId: string,
    externalTransactionIds: readonly string[],
    fingerprints: readonly string[],
  ): Promise<
    Map<
      string,
      {
        id: string;
        externalTransactionId: string | null;
        fingerprint: string | null;
      }
    >
  > {
    const account = await this.getAccount(userId, accountId, true);
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        householdId: account.householdId,
        accountId,
        deletedAt: null,
        OR: [
          ...(externalTransactionIds.length
            ? [{ externalTransactionId: { in: [...externalTransactionIds] } }]
            : []),
          ...(fingerprints.length
            ? [{ fingerprint: { in: [...fingerprints] } }]
            : []),
        ],
      },
      select: { id: true, externalTransactionId: true, fingerprint: true },
    });
    const result = new Map<
      string,
      {
        id: string;
        externalTransactionId: string | null;
        fingerprint: string | null;
      }
    >();
    for (const transaction of transactions) {
      if (transaction.externalTransactionId)
        result.set(
          `external:${transaction.externalTransactionId}`,
          transaction,
        );
      if (transaction.fingerprint)
        result.set(`fingerprint:${transaction.fingerprint}`, transaction);
    }
    return result;
  }

  public async createImportedTransactions(input: {
    userId: string;
    accountId: string;
    importSessionId: string;
    rows: readonly ImportedLedgerRow[];
  }): Promise<number> {
    const account = await this.getAccount(input.userId, input.accountId, true);
    for (const row of input.rows) {
      if (row.currencyCode !== account.currencyCode) {
        throw financeInvalid('Měna importovaného řádku neodpovídá účtu.');
      }
      if (row.categoryId)
        await this.verifyCategory(input.userId, row.categoryId, row.type);
    }
    const result = await this.prisma.financialTransaction.createMany({
      data: input.rows.map((row) => ({
        householdId: account.householdId,
        accountId: account.id,
        categoryId: row.categoryId,
        type: row.type,
        source: 'CSV_IMPORT',
        amountMinor: row.amountMinor,
        currencyCode: row.currencyCode,
        bookedDate: row.bookedDate,
        transactionDate: row.transactionDate,
        externalTransactionId: row.externalTransactionId,
        fingerprint: row.fingerprint,
        merchantNormalizedName: row.merchantNormalizedName,
        counterpartyName: row.counterpartyName,
        counterpartyAccount: row.counterpartyAccount,
        description: row.description,
        variableSymbol: row.variableSymbol,
        constantSymbol: row.constantSymbol,
        specificSymbol: row.specificSymbol,
        importSessionId: input.importSessionId,
        importRowId: row.importRowId,
        createdByUserId: input.userId,
        updatedByUserId: input.userId,
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  public async createImportedCardRepayment(input: {
    userId: string;
    creditAccountId: string;
    importSessionId: string;
    row: ImportedCardRepaymentRow;
  }): Promise<number> {
    const credit = await this.getAccount(
      input.userId,
      input.creditAccountId,
      true,
    );
    const source = await this.getAccount(
      input.userId,
      input.row.sourceAccountId,
      true,
    );
    if (credit.type !== 'CREDIT_CARD' || credit.id === source.id)
      throw financeInvalid(
        'Splátka musí směřovat z jiného účtu na kreditní kartu.',
      );
    if (
      credit.householdId !== source.householdId ||
      credit.currencyCode !== source.currencyCode ||
      credit.currencyCode !== input.row.currencyCode
    )
      throw financeInvalid(
        'Účty splátky musí patřit stejné domácnosti a mít stejnou měnu.',
      );
    const existingImport = await this.prisma.financialTransaction.findUnique({
      where: { importRowId: input.row.importRowId },
      select: { id: true },
    });
    if (existingImport) return 0;
    return this.prisma.$transaction(async (transaction) => {
      const transferId = randomUUID();
      const incomingId = randomUUID();
      const outgoingId = input.row.matchingTransactionId ?? randomUUID();
      const matching = input.row.matchingTransactionId
        ? await transaction.financialTransaction.findFirst({
            where: {
              id: input.row.matchingTransactionId,
              householdId: credit.householdId,
              accountId: source.id,
              deletedAt: null,
              transferId: null,
            },
            select: { id: true },
          })
        : null;
      if (input.row.matchingTransactionId && !matching) throw financeNotFound();
      await transaction.financialTransfer.create({
        data: {
          id: transferId,
          householdId: credit.householdId,
          fromAccountId: source.id,
          toAccountId: credit.id,
          amountMinor: input.row.amountMinor,
          currencyCode: input.row.currencyCode,
          bookedDate: input.row.bookedDate,
          createdByUserId: input.userId,
        },
      });
      if (matching) {
        await transaction.financialTransaction.update({
          where: { id: matching.id },
          data: {
            type: 'TRANSFER_OUT',
            categoryId: null,
            transferId,
            updatedByUserId: input.userId,
          },
        });
      } else {
        await transaction.financialTransaction.create({
          data: {
            id: outgoingId,
            householdId: credit.householdId,
            accountId: source.id,
            type: 'TRANSFER_OUT',
            source: 'MANUAL',
            amountMinor: input.row.amountMinor,
            currencyCode: input.row.currencyCode,
            bookedDate: input.row.bookedDate,
            transferId,
            createdByUserId: input.userId,
            updatedByUserId: input.userId,
          },
        });
      }
      await transaction.financialTransaction.create({
        data: {
          id: incomingId,
          householdId: credit.householdId,
          accountId: credit.id,
          type: 'TRANSFER_IN',
          source: 'CSV_IMPORT',
          amountMinor: input.row.amountMinor,
          currencyCode: input.row.currencyCode,
          bookedDate: input.row.bookedDate,
          externalTransactionId: input.row.externalTransactionId,
          fingerprint: input.row.fingerprint,
          transferId,
          importSessionId: input.importSessionId,
          importRowId: input.row.importRowId,
          createdByUserId: input.userId,
          updatedByUserId: input.userId,
        },
      });
      await transaction.financialTransfer.update({
        where: { id: transferId },
        data: {
          outgoingTransactionId: outgoingId,
          incomingTransactionId: incomingId,
        },
      });
      return 1;
    });
  }

  public async safeTransactionSummary(userId: string, transactionId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    const transaction = await this.prisma.financialTransaction.findFirst({
      where: {
        id: transactionId,
        householdId: membership.householdId,
        deletedAt: null,
      },
      select: {
        id: true,
        accountId: true,
        type: true,
        amountMinor: true,
        currencyCode: true,
        bookedDate: true,
      },
    });
    if (!transaction) throw financeNotFound();
    return {
      ...transaction,
      amountMinor: transaction.amountMinor.toString(),
      bookedDate: dateOnlyString(transaction.bookedDate),
    };
  }

  public async verifyAccessibleTransactionSummaries(
    userId: string,
    transactionIds: readonly string[],
  ) {
    const ids = [...new Set(transactionIds)];
    if (ids.length === 0) return [];
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        id: { in: ids },
        householdId: membership.householdId,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        amountMinor: true,
        currencyCode: true,
        bookedDate: true,
        description: true,
        counterpartyName: true,
      },
    });
    if (transactions.length !== ids.length) throw financeNotFound();
    const byId = new Map(transactions.map((item) => [item.id, item]));
    return ids.map((id) => {
      const item = byId.get(id);
      if (!item) throw financeNotFound();
      return {
        ...item,
        amountMinor: item.amountMinor.toString(),
        bookedDate: dateOnlyString(item.bookedDate),
      };
    });
  }
}
