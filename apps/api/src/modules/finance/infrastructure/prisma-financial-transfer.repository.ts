import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { dateOnly } from '../domain/finance.types.js';
import { parseMinorUnits } from '../domain/money.js';
import type {
  CreateFinancialTransferDto,
  UpdateFinancialTransferDto,
} from '../presentation/dto/financial-transfer.dto.js';

@Injectable()
export class PrismaFinancialTransferRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public findRecord(householdId: string, id: string) {
    return this.prisma.financialTransfer.findFirst({
      where: { id, householdId, deletedAt: null },
      include: { fromAccount: true, toAccount: true },
    });
  }

  public async create(input: {
    householdId: string;
    userId: string;
    currencyCode: string;
    data: CreateFinancialTransferDto;
  }) {
    const transferId = randomUUID();
    const outgoingId = randomUUID();
    const incomingId = randomUUID();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.financialTransfer.create({
        data: {
          id: transferId,
          householdId: input.householdId,
          fromAccountId: input.data.fromAccountId,
          toAccountId: input.data.toAccountId,
          amountMinor: parseMinorUnits(input.data.amountMinor),
          currencyCode: input.currencyCode,
          bookedDate: dateOnly(input.data.bookedDate),
          note: input.data.note ?? null,
          createdByUserId: input.userId,
        },
      });
      await transaction.financialTransaction.createMany({
        data: [
          {
            id: outgoingId,
            householdId: input.householdId,
            accountId: input.data.fromAccountId,
            type: 'TRANSFER_OUT',
            source: 'MANUAL',
            amountMinor: parseMinorUnits(input.data.amountMinor),
            currencyCode: input.currencyCode,
            bookedDate: dateOnly(input.data.bookedDate),
            note: input.data.note ?? null,
            transferId,
            createdByUserId: input.userId,
            updatedByUserId: input.userId,
          },
          {
            id: incomingId,
            householdId: input.householdId,
            accountId: input.data.toAccountId,
            type: 'TRANSFER_IN',
            source: 'MANUAL',
            amountMinor: parseMinorUnits(input.data.amountMinor),
            currencyCode: input.currencyCode,
            bookedDate: dateOnly(input.data.bookedDate),
            note: input.data.note ?? null,
            transferId,
            createdByUserId: input.userId,
            updatedByUserId: input.userId,
          },
        ],
      });
      await transaction.financialTransfer.update({
        where: { id: transferId },
        data: {
          outgoingTransactionId: outgoingId,
          incomingTransactionId: incomingId,
        },
      });
      await this.audit.record(transaction, {
        action: 'FINANCIAL_TRANSFER_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'FinancialTransfer',
        entityId: transferId,
        metadata: { transferId, currencyCode: input.currencyCode },
      });
    });
    return transferId;
  }

  public async update(input: {
    householdId: string;
    userId: string;
    transferId: string;
    currencyCode: string;
    data: UpdateFinancialTransferDto;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const transfer = await transaction.financialTransfer.findFirst({
        where: {
          id: input.transferId,
          householdId: input.householdId,
          deletedAt: null,
        },
      });
      if (!transfer?.outgoingTransactionId || !transfer.incomingTransactionId)
        return false;
      const amountMinor = parseMinorUnits(input.data.amountMinor);
      const bookedDate = dateOnly(input.data.bookedDate);
      await transaction.financialTransfer.update({
        where: { id: transfer.id },
        data: {
          fromAccountId: input.data.fromAccountId,
          toAccountId: input.data.toAccountId,
          amountMinor,
          currencyCode: input.currencyCode,
          bookedDate,
          note: input.data.note ?? null,
        },
      });
      await transaction.financialTransaction.update({
        where: { id: transfer.outgoingTransactionId },
        data: {
          accountId: input.data.fromAccountId,
          amountMinor,
          currencyCode: input.currencyCode,
          bookedDate,
          note: input.data.note ?? null,
          updatedByUserId: input.userId,
        },
      });
      await transaction.financialTransaction.update({
        where: { id: transfer.incomingTransactionId },
        data: {
          accountId: input.data.toAccountId,
          amountMinor,
          currencyCode: input.currencyCode,
          bookedDate,
          note: input.data.note ?? null,
          updatedByUserId: input.userId,
        },
      });
      await this.audit.record(transaction, {
        action: 'FINANCIAL_TRANSFER_UPDATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'FinancialTransfer',
        entityId: transfer.id,
        metadata: {
          transferId: transfer.id,
          changedFields: Object.keys(input.data),
        },
      });
      return true;
    });
  }

  public async softDelete(
    householdId: string,
    userId: string,
    transferId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const transfer = await transaction.financialTransfer.findFirst({
        where: { id: transferId, householdId, deletedAt: null },
      });
      if (!transfer) return false;
      const deletedAt = new Date();
      await transaction.financialTransfer.update({
        where: { id: transfer.id },
        data: { deletedAt },
      });
      await transaction.financialTransaction.updateMany({
        where: { transferId: transfer.id, householdId },
        data: { deletedAt, deletedByUserId: userId, updatedByUserId: userId },
      });
      await this.audit.record(transaction, {
        action: 'FINANCIAL_TRANSFER_DELETED',
        householdId,
        userId,
        entityType: 'FinancialTransfer',
        entityId: transfer.id,
        metadata: { transferId: transfer.id },
      });
      return true;
    });
  }
}
