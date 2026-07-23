import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import type {
  CreateFinancialAccountDto,
  UpdateFinancialAccountDto,
} from '../presentation/dto/financial-account.dto.js';
import {
  dateOnly,
  dateOnlyString,
  normalizeFinanceName,
} from '../domain/finance.types.js';
import { parseMinorUnits } from '../domain/money.js';
import { calculateAccountBalance } from '../domain/ledger-rules.js';

@Injectable()
export class PrismaFinancialAccountRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async list(householdId: string, includeArchived = false) {
    const accounts = await this.prisma.financialAccount.findMany({
      where: { householdId, ...(!includeArchived ? { archivedAt: null } : {}) },
      orderBy: [{ archivedAt: 'asc' }, { name: 'asc' }],
      include: {
        transactions: {
          where: { deletedAt: null },
          select: { type: true, amountMinor: true },
        },
      },
    });
    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      openingBalanceMinor: account.openingBalanceMinor.toString(),
      openingBalanceDate: dateOnlyString(account.openingBalanceDate),
      currentBalanceMinor: calculateAccountBalance(
        account.openingBalanceMinor,
        account.transactions,
      ).toString(),
      ...creditCardSummary(account),
      description: account.description,
      colorToken: account.colorToken,
      iconKey: account.iconKey,
      archivedAt: account.archivedAt?.toISOString() ?? null,
    }));
  }

  public findRecord(householdId: string, id: string) {
    return this.prisma.financialAccount.findFirst({
      where: { id, householdId },
      include: {
        transactions: {
          where: { deletedAt: null },
          select: { type: true, amountMinor: true },
        },
      },
    });
  }

  public async detail(householdId: string, id: string) {
    const account = await this.findRecord(householdId, id);
    if (!account) return null;
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currencyCode: account.currencyCode,
      openingBalanceMinor: account.openingBalanceMinor.toString(),
      openingBalanceDate: dateOnlyString(account.openingBalanceDate),
      currentBalanceMinor: calculateAccountBalance(
        account.openingBalanceMinor,
        account.transactions,
      ).toString(),
      ...creditCardSummary(account),
      description: account.description,
      colorToken: account.colorToken,
      iconKey: account.iconKey,
      archivedAt: account.archivedAt?.toISOString() ?? null,
      transactionCount: account.transactions.length,
    };
  }

  public async create(
    householdId: string,
    userId: string,
    input: CreateFinancialAccountDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const account = await transaction.financialAccount.create({
        data: {
          householdId,
          name: input.name,
          normalizedName: normalizeFinanceName(input.name),
          type: input.type,
          currencyCode: input.currencyCode,
          openingBalanceMinor: parseMinorUnits(input.openingBalanceMinor, {
            allowNegative: true,
            allowZero: true,
          }),
          openingBalanceDate: dateOnly(input.openingBalanceDate),
          description: input.description ?? null,
          creditLimitMinor:
            input.creditLimitMinor === undefined ||
            input.creditLimitMinor === null
              ? null
              : parseMinorUnits(input.creditLimitMinor, { allowZero: true }),
          statementDayOfMonth: input.statementDayOfMonth ?? null,
          paymentDueDayOfMonth: input.paymentDueDayOfMonth ?? null,
          maskedIdentifier: input.maskedIdentifier ?? null,
          colorToken: input.colorToken,
          iconKey: input.iconKey,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
      });
      await this.audit.record(transaction, {
        action: 'FINANCIAL_ACCOUNT_CREATED',
        householdId,
        userId,
        entityType: 'FinancialAccount',
        entityId: account.id,
        metadata: { accountId: account.id, currencyCode: account.currencyCode },
      });
      return account.id;
    });
  }

  public async update(
    householdId: string,
    userId: string,
    id: string,
    input: UpdateFinancialAccountDto,
  ) {
    const data = {
      ...(input.name !== undefined
        ? { name: input.name, normalizedName: normalizeFinanceName(input.name) }
        : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.currencyCode !== undefined
        ? { currencyCode: input.currencyCode }
        : {}),
      ...(input.openingBalanceMinor !== undefined
        ? {
            openingBalanceMinor: parseMinorUnits(input.openingBalanceMinor, {
              allowNegative: true,
              allowZero: true,
            }),
          }
        : {}),
      ...(input.openingBalanceDate !== undefined
        ? { openingBalanceDate: dateOnly(input.openingBalanceDate) }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.creditLimitMinor !== undefined
        ? {
            creditLimitMinor:
              input.creditLimitMinor === null
                ? null
                : parseMinorUnits(input.creditLimitMinor, { allowZero: true }),
          }
        : {}),
      ...(input.statementDayOfMonth !== undefined
        ? { statementDayOfMonth: input.statementDayOfMonth }
        : {}),
      ...(input.paymentDueDayOfMonth !== undefined
        ? { paymentDueDayOfMonth: input.paymentDueDayOfMonth }
        : {}),
      ...(input.maskedIdentifier !== undefined
        ? { maskedIdentifier: input.maskedIdentifier }
        : {}),
      ...(input.colorToken !== undefined
        ? { colorToken: input.colorToken }
        : {}),
      ...(input.iconKey !== undefined ? { iconKey: input.iconKey } : {}),
      updatedByUserId: userId,
    };
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.financialAccount.updateMany({
        where: { id, householdId },
        data,
      });
      if (result.count === 0) return false;
      await this.audit.record(transaction, {
        action: 'FINANCIAL_ACCOUNT_UPDATED',
        householdId,
        userId,
        entityType: 'FinancialAccount',
        entityId: id,
        metadata: { accountId: id, changedFields: Object.keys(input) },
      });
      return true;
    });
  }

  public async setArchived(
    householdId: string,
    userId: string,
    id: string,
    archived: boolean,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.financialAccount.updateMany({
        where: { id, householdId },
        data: {
          archivedAt: archived ? new Date() : null,
          updatedByUserId: userId,
        },
      });
      if (result.count === 0) return false;
      await this.audit.record(transaction, {
        action: archived
          ? 'FINANCIAL_ACCOUNT_ARCHIVED'
          : 'FINANCIAL_ACCOUNT_RESTORED',
        householdId,
        userId,
        entityType: 'FinancialAccount',
        entityId: id,
        metadata: { accountId: id },
      });
      return true;
    });
  }
}

function creditCardSummary(account: {
  type: string;
  creditLimitMinor: bigint | null;
  statementDayOfMonth: number | null;
  paymentDueDayOfMonth: number | null;
  maskedIdentifier: string | null;
  openingBalanceMinor: bigint;
  transactions: readonly { type: string; amountMinor: bigint }[];
}) {
  const balance = calculateAccountBalance(
    account.openingBalanceMinor,
    account.transactions as Parameters<typeof calculateAccountBalance>[1],
  );
  const debt = account.type === 'CREDIT_CARD' && balance < 0n ? -balance : 0n;
  const available =
    account.creditLimitMinor === null
      ? null
      : account.creditLimitMinor > debt
        ? account.creditLimitMinor - debt
        : 0n;
  return {
    creditLimitMinor: account.creditLimitMinor?.toString() ?? null,
    currentDebtMinor: debt.toString(),
    availableCreditMinor: available?.toString() ?? null,
    statementDayOfMonth: account.statementDayOfMonth,
    paymentDueDayOfMonth: account.paymentDueDayOfMonth,
    maskedIdentifier: account.maskedIdentifier,
  };
}
