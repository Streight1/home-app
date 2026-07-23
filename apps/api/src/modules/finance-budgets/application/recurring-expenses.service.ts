import { Injectable } from '@nestjs/common';
import { FinanceAnalyticsFacade } from '../../finance-analytics/public/finance-analytics.facade.js';
import {
  FINANCE_READ_ROLE,
  FINANCE_WRITE_ROLE,
} from '../../finance/domain/finance-access.policy.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { detectRecurringPattern } from '../domain/recurring-detection.js';
import { financeBudgetNotFound } from '../domain/finance-budget.errors.js';
import {
  mapRecurringCandidate,
  mapRecurringExpense,
  PrismaRecurringExpenseRepository,
  type RecurringCandidateDraft,
} from '../infrastructure/prisma-recurring-expense.repository.js';
import type {
  ListRecurringQueryDto,
  UpdateRecurringExpenseDto,
} from '../presentation/dto/insights.dto.js';

@Injectable()
export class RecurringExpensesService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly analytics: FinanceAnalyticsFacade,
    private readonly recurring: PrismaRecurringExpenseRepository,
  ) {}

  public async listCandidates(userId: string, query: ListRecurringQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    return {
      items: (
        await this.recurring.listCandidates(
          membership.householdId,
          query.currencyCode,
        )
      ).map(mapRecurringCandidate),
    };
  }

  public async listExpenses(userId: string, query: ListRecurringQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    return {
      items: (
        await this.recurring.listExpenses(
          membership.householdId,
          query.currencyCode,
        )
      ).map(mapRecurringExpense),
    };
  }

  public async refreshCandidates(userId: string, now = new Date()) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const from = new Date(
      Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth() - 6, 1),
    );
    const rows = (
      await this.analytics.loadExpenseHistory(userId, { from, to: now })
    ).filter(
      (row) => row.type === 'EXPENSE' && Boolean(row.merchantNormalizedName),
    );
    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
      const merchant = row.merchantNormalizedName;
      if (!merchant) continue;
      const key = `${row.accountId}|${row.currencyCode}|${merchant}`;
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    }
    const drafts: RecurringCandidateDraft[] = [];
    for (const items of grouped.values()) {
      const pattern = detectRecurringPattern(items);
      const first = items[0];
      if (!pattern || !first?.merchantNormalizedName) continue;
      drafts.push({
        accountId: first.accountId,
        merchantNormalizedName: first.merchantNormalizedName,
        categoryId: first.category?.id ?? null,
        currencyCode: first.currencyCode,
        typicalAmountMinor: pattern.typicalAmountMinor,
        detectedFrequency: pattern.frequency,
        nextExpectedDate: pattern.nextExpectedDate,
        confidenceScore: pattern.confidenceScore,
        evidenceTransactionCount: pattern.evidenceTransactionCount,
        firstObservedDate: pattern.firstObservedDate,
        lastObservedDate: pattern.lastObservedDate,
      });
    }
    await this.recurring.upsertCandidates(membership.householdId, drafts);
    return { detected: drafts.length };
  }

  public async confirm(userId: string, candidateId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const id = await this.recurring.confirm(
      membership.householdId,
      userId,
      candidateId,
    );
    if (!id) throw financeBudgetNotFound();
    return { id };
  }

  public async dismiss(userId: string, candidateId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    if (
      !(await this.recurring.dismiss(
        membership.householdId,
        userId,
        candidateId,
      ))
    )
      throw financeBudgetNotFound();
    return { id: candidateId, status: 'DISMISSED' as const };
  }

  public async update(
    userId: string,
    id: string,
    input: UpdateRecurringExpenseDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    if (
      !(await this.recurring.update(membership.householdId, userId, id, input))
    )
      throw financeBudgetNotFound();
    return { id };
  }

  public async archive(userId: string, id: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    if (!(await this.recurring.archive(membership.householdId, userId, id)))
      throw financeBudgetNotFound();
    return { id, status: 'ARCHIVED' as const };
  }
}
