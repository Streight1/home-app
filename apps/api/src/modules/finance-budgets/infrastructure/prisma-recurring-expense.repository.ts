import { Injectable } from '@nestjs/common';
import type { RecurringExpenseFrequency } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { dateOnlyString } from '../../finance/domain/finance.types.js';
import { parseMinorUnits } from '../../finance/domain/money.js';
import type { UpdateRecurringExpenseDto } from '../presentation/dto/insights.dto.js';

export interface RecurringCandidateDraft {
  accountId: string;
  merchantNormalizedName: string;
  categoryId: string | null;
  currencyCode: string;
  typicalAmountMinor: bigint;
  detectedFrequency: RecurringExpenseFrequency;
  nextExpectedDate: Date;
  confidenceScore: number;
  evidenceTransactionCount: number;
  firstObservedDate: Date;
  lastObservedDate: Date;
}

@Injectable()
export class PrismaRecurringExpenseRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async upsertCandidates(
    householdId: string,
    drafts: readonly RecurringCandidateDraft[],
  ) {
    for (const draft of drafts) {
      const key = {
        householdId_accountId_merchantNormalizedName_currencyCode: {
          householdId,
          accountId: draft.accountId,
          merchantNormalizedName: draft.merchantNormalizedName,
          currencyCode: draft.currencyCode,
        },
      };
      const existing = await this.prisma.recurringExpenseCandidate.findUnique({
        where: key,
        select: { status: true },
      });
      if (existing?.status === 'DISMISSED' || existing?.status === 'CONFIRMED')
        continue;
      await this.prisma.recurringExpenseCandidate.upsert({
        where: key,
        create: { householdId, ...draft },
        update: { ...draft, status: 'PROPOSED' },
      });
    }
  }

  public listCandidates(householdId: string, currencyCode?: string) {
    return this.prisma.recurringExpenseCandidate.findMany({
      where: {
        householdId,
        status: 'PROPOSED',
        ...(currencyCode ? { currencyCode } : {}),
      },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ confidenceScore: 'desc' }, { nextExpectedDate: 'asc' }],
      take: 100,
    });
  }

  public listExpenses(householdId: string, currencyCode?: string) {
    return this.prisma.recurringExpense.findMany({
      where: {
        householdId,
        status: { not: 'ARCHIVED' },
        ...(currencyCode ? { currencyCode } : {}),
      },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ nextExpectedDate: 'asc' }, { name: 'asc' }],
    });
  }

  public async confirm(
    householdId: string,
    userId: string,
    candidateId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const candidate = await transaction.recurringExpenseCandidate.findFirst({
        where: { id: candidateId, householdId, status: 'PROPOSED' },
      });
      if (!candidate) return null;
      const expense = await transaction.recurringExpense.create({
        data: {
          householdId,
          candidateId,
          name: candidate.merchantNormalizedName,
          merchantNormalizedName: candidate.merchantNormalizedName,
          categoryId: candidate.categoryId,
          accountId: candidate.accountId,
          currencyCode: candidate.currencyCode,
          expectedAmountMinor: candidate.typicalAmountMinor,
          amountTolerancePercent: candidate.amountTolerancePercent,
          frequency: candidate.detectedFrequency,
          nextExpectedDate: candidate.nextExpectedDate,
          createdByUserId: userId,
        },
      });
      await transaction.recurringExpenseCandidate.update({
        where: { id: candidateId },
        data: { status: 'CONFIRMED' },
      });
      await this.audit.record(transaction, {
        action: 'RECURRING_EXPENSE_CONFIRMED',
        householdId,
        userId,
        entityType: 'RecurringExpense',
        entityId: expense.id,
        metadata: { recurringExpenseId: expense.id },
      });
      return expense.id;
    });
  }

  public async dismiss(
    householdId: string,
    userId: string,
    candidateId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.recurringExpenseCandidate.updateMany({
        where: { id: candidateId, householdId, status: 'PROPOSED' },
        data: { status: 'DISMISSED' },
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action: 'RECURRING_CANDIDATE_DISMISSED',
        householdId,
        userId,
        entityType: 'RecurringExpenseCandidate',
        entityId: candidateId,
        metadata: { candidateId },
      });
      return true;
    });
  }

  public async update(
    householdId: string,
    userId: string,
    id: string,
    input: UpdateRecurringExpenseDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.recurringExpense.updateMany({
        where: { id, householdId, status: { not: 'ARCHIVED' } },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.expectedAmountMinor !== undefined
            ? {
                expectedAmountMinor: parseMinorUnits(input.expectedAmountMinor),
              }
            : {}),
          ...(input.amountTolerancePercent !== undefined
            ? { amountTolerancePercent: input.amountTolerancePercent }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action: 'RECURRING_EXPENSE_UPDATED',
        householdId,
        userId,
        entityType: 'RecurringExpense',
        entityId: id,
        metadata: { recurringExpenseId: id, changedFields: Object.keys(input) },
      });
      return true;
    });
  }

  public async archive(householdId: string, userId: string, id: string) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.recurringExpense.updateMany({
        where: { id, householdId, status: { not: 'ARCHIVED' } },
        data: { status: 'ARCHIVED', archivedAt: new Date() },
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action: 'RECURRING_EXPENSE_ARCHIVED',
        householdId,
        userId,
        entityType: 'RecurringExpense',
        entityId: id,
        metadata: { recurringExpenseId: id },
      });
      return true;
    });
  }
}

export const mapRecurringCandidate = (
  candidate: Awaited<
    ReturnType<PrismaRecurringExpenseRepository['listCandidates']>
  >[number],
) => ({
  id: candidate.id,
  merchantNormalizedName: candidate.merchantNormalizedName,
  category: candidate.category,
  account: candidate.account,
  currencyCode: candidate.currencyCode,
  typicalAmountMinor: candidate.typicalAmountMinor.toString(),
  amountTolerancePercent: candidate.amountTolerancePercent,
  detectedFrequency: candidate.detectedFrequency,
  nextExpectedDate: candidate.nextExpectedDate
    ? dateOnlyString(candidate.nextExpectedDate)
    : null,
  confidenceScore: candidate.confidenceScore,
  evidenceTransactionCount: candidate.evidenceTransactionCount,
  firstObservedDate: dateOnlyString(candidate.firstObservedDate),
  lastObservedDate: dateOnlyString(candidate.lastObservedDate),
  status: candidate.status,
});

export const mapRecurringExpense = (
  expense: Awaited<
    ReturnType<PrismaRecurringExpenseRepository['listExpenses']>
  >[number],
) => ({
  id: expense.id,
  name: expense.name,
  merchantNormalizedName: expense.merchantNormalizedName,
  category: expense.category,
  account: expense.account,
  currencyCode: expense.currencyCode,
  expectedAmountMinor: expense.expectedAmountMinor.toString(),
  amountTolerancePercent: expense.amountTolerancePercent,
  frequency: expense.frequency,
  nextExpectedDate: expense.nextExpectedDate
    ? dateOnlyString(expense.nextExpectedDate)
    : null,
  status: expense.status,
});
