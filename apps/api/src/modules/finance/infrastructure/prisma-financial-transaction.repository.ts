import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { dateOnly } from '../domain/finance.types.js';
import { parseMinorUnits } from '../domain/money.js';
import type { CreateFinancialTransactionDto } from '../presentation/dto/financial-transaction.dto.js';
import type { ListFinancialTransactionsDto } from '../presentation/dto/list-financial-transactions.dto.js';
import { includeFinancialTransaction } from './financial-transaction-record.js';

@Injectable()
export class PrismaFinancialTransactionRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async list(householdId: string, query: ListFinancialTransactionsDto) {
    const where: Prisma.FinancialTransactionWhereInput = {
      householdId,
      deletedAt: null,
      ...(query.accountId ? { accountId: query.accountId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            bookedDate: {
              ...(query.dateFrom ? { gte: dateOnly(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: dateOnly(query.dateTo) } : {}),
            },
          }
        : {}),
      ...(query.amountFromMinor || query.amountToMinor
        ? {
            amountMinor: {
              ...(query.amountFromMinor
                ? { gte: parseMinorUnits(query.amountFromMinor) }
                : {}),
              ...(query.amountToMinor
                ? { lte: parseMinorUnits(query.amountToMinor) }
                : {}),
            },
          }
        : {}),
      ...(query.documentLinked !== undefined
        ? { documents: query.documentLinked ? { some: {} } : { none: {} } }
        : {}),
      ...(query.query
        ? {
            OR: [
              {
                counterpartyName: {
                  contains: query.query,
                  mode: 'insensitive',
                },
              },
              { description: { contains: query.query, mode: 'insensitive' } },
              {
                variableSymbol: { contains: query.query, mode: 'insensitive' },
              },
              { note: { contains: query.query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.FinancialTransactionOrderByWithRelationInput = {
      [query.sortBy]: query.sortDirection,
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.financialTransaction.findMany({
        where,
        include: includeFinancialTransaction,
        orderBy: [orderBy, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.financialTransaction.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  public findRecord(householdId: string, id: string) {
    return this.prisma.financialTransaction.findFirst({
      where: { id, householdId, deletedAt: null },
      include: includeFinancialTransaction,
    });
  }

  public async create(input: {
    householdId: string;
    userId: string;
    type: 'EXPENSE' | 'INCOME';
    currencyCode: string;
    data: CreateFinancialTransactionDto;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.financialTransaction.create({
        data: {
          householdId: input.householdId,
          accountId: input.data.accountId,
          categoryId: input.data.categoryId ?? null,
          type: input.type,
          source: 'MANUAL',
          amountMinor: parseMinorUnits(input.data.amountMinor),
          currencyCode: input.currencyCode,
          bookedDate: dateOnly(input.data.bookedDate),
          counterpartyName: input.data.counterpartyName ?? null,
          counterpartyAccount: input.data.counterpartyAccount ?? null,
          description: input.data.description ?? null,
          variableSymbol: input.data.variableSymbol ?? null,
          constantSymbol: input.data.constantSymbol ?? null,
          specificSymbol: input.data.specificSymbol ?? null,
          note: input.data.note ?? null,
          createdByUserId: input.userId,
          updatedByUserId: input.userId,
          documents: {
            create: input.data.documentIds.map((documentId) => ({
              documentId,
              createdByUserId: input.userId,
            })),
          },
        },
      });
      await this.audit.record(transaction, {
        action: 'FINANCIAL_TRANSACTION_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'FinancialTransaction',
        entityId: created.id,
        metadata: { transactionId: created.id, type: input.type },
      });
      return created.id;
    });
  }

  public async update(input: {
    householdId: string;
    userId: string;
    transactionId: string;
    data: CreateFinancialTransactionDto;
    currencyCode: string;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.financialTransaction.updateMany({
        where: {
          id: input.transactionId,
          householdId: input.householdId,
          source: 'MANUAL',
          type: { in: ['EXPENSE', 'INCOME'] },
          deletedAt: null,
        },
        data: {
          accountId: input.data.accountId,
          categoryId: input.data.categoryId ?? null,
          amountMinor: parseMinorUnits(input.data.amountMinor),
          currencyCode: input.currencyCode,
          bookedDate: dateOnly(input.data.bookedDate),
          counterpartyName: input.data.counterpartyName ?? null,
          counterpartyAccount: input.data.counterpartyAccount ?? null,
          description: input.data.description ?? null,
          variableSymbol: input.data.variableSymbol ?? null,
          constantSymbol: input.data.constantSymbol ?? null,
          specificSymbol: input.data.specificSymbol ?? null,
          note: input.data.note ?? null,
          updatedByUserId: input.userId,
        },
      });
      if (result.count === 0) return false;
      await transaction.financialTransactionDocument.deleteMany({
        where: { transactionId: input.transactionId },
      });
      if (input.data.documentIds.length > 0) {
        await transaction.financialTransactionDocument.createMany({
          data: input.data.documentIds.map((documentId) => ({
            transactionId: input.transactionId,
            documentId,
            createdByUserId: input.userId,
          })),
        });
      }
      await this.audit.record(transaction, {
        action: 'FINANCIAL_TRANSACTION_UPDATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'FinancialTransaction',
        entityId: input.transactionId,
        metadata: {
          transactionId: input.transactionId,
          changedFields: Object.keys(input.data),
        },
      });
      return true;
    });
  }

  public async replaceDocuments(
    householdId: string,
    userId: string,
    transactionId: string,
    documentIds: string[],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.financialTransaction.findFirst({
        where: { id: transactionId, householdId, deletedAt: null },
        select: { id: true },
      });
      if (!existing) return false;
      await transaction.financialTransactionDocument.deleteMany({
        where: { transactionId },
      });
      if (documentIds.length > 0) {
        await transaction.financialTransactionDocument.createMany({
          data: documentIds.map((documentId) => ({
            transactionId,
            documentId,
            createdByUserId: userId,
          })),
        });
      }
      await this.audit.record(transaction, {
        action: 'FINANCIAL_TRANSACTION_DOCUMENTS_CHANGED',
        householdId,
        userId,
        entityType: 'FinancialTransaction',
        entityId: transactionId,
        metadata: { transactionId, documentCount: documentIds.length },
      });
      return true;
    });
  }

  public async softDelete(
    householdId: string,
    userId: string,
    transactionId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.financialTransaction.updateMany({
        where: {
          id: transactionId,
          householdId,
          deletedAt: null,
          transferId: null,
          source: 'MANUAL',
        },
        data: {
          deletedAt: new Date(),
          deletedByUserId: userId,
          updatedByUserId: userId,
        },
      });
      if (result.count === 0) return false;
      await this.audit.record(transaction, {
        action: 'FINANCIAL_TRANSACTION_DELETED',
        householdId,
        userId,
        entityType: 'FinancialTransaction',
        entityId: transactionId,
        metadata: { transactionId },
      });
      return true;
    });
  }

  public listForReport(householdId: string, from: Date, to: Date) {
    return this.prisma.financialTransaction.findMany({
      where: {
        householdId,
        deletedAt: null,
        bookedDate: { gte: from, lte: to },
        type: { in: ['EXPENSE', 'REFUND', 'INCOME'] },
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }
}
