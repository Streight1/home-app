import { Injectable } from '@nestjs/common';
import { FinanceAnalyticsFacade } from '../../finance-analytics/public/finance-analytics.facade.js';
import {
  FINANCE_READ_ROLE,
  FINANCE_WRITE_ROLE,
} from '../../finance/domain/finance-access.policy.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { dateOnlyString } from '../../finance/domain/finance.types.js';
import { financeBudgetNotFound } from '../domain/finance-budget.errors.js';
import { budgetInsightDrafts } from '../domain/budget-insight-detection.js';
import {
  createInsightDraft,
  detectInsights,
} from '../domain/spending-insight-detection.js';
import { PrismaInsightRepository } from '../infrastructure/prisma-insight.repository.js';
import type {
  ListInsightsQueryDto,
  RefreshInsightsDto,
} from '../presentation/dto/insights.dto.js';
import { BudgetService } from './budget.service.js';
import { BudgetSummaryService } from './budget-summary.service.js';
import { mapInsight } from './insight-response.mapper.js';
import { RecurringExpensesService } from './recurring-expenses.service.js';

@Injectable()
export class SpendingInsightsService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly analytics: FinanceAnalyticsFacade,
    private readonly insights: PrismaInsightRepository,
    private readonly recurring: RecurringExpensesService,
    private readonly budgets: BudgetService,
    private readonly summaries: BudgetSummaryService,
  ) {}

  public async list(userId: string, query: ListInsightsQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    return {
      items: (await this.insights.list(membership.householdId, query)).map(
        mapInsight,
      ),
    };
  }

  public async refresh(
    userId: string,
    input: RefreshInsightsDto,
    now = new Date(),
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
    );
    const historyStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1),
    );
    const rows = await this.analytics.loadExpenseHistory(userId, {
      from: historyStart,
      to: periodEnd,
      currencyCode: input.currencyCode,
    });
    const drafts = detectInsights(rows, {
      periodStart,
      periodEnd,
      currencyCode: input.currencyCode,
      comparisonDay: now.getUTCDate(),
    });
    const activeBudgets = await this.budgets.list(userId, {
      status: 'ACTIVE',
      currencyCode: input.currencyCode,
    });
    for (const budget of activeBudgets.items.filter(
      (item) =>
        item.periodStart <= dateOnlyString(now) &&
        item.periodEnd >= dateOnlyString(now),
    )) {
      drafts.push(
        ...budgetInsightDrafts(
          await this.summaries.get(userId, budget.id, now),
        ),
      );
    }
    const recurring = await this.recurring.refreshCandidates(userId, now);
    const candidates = await this.recurring.listCandidates(userId, {
      currencyCode: input.currencyCode,
    });
    for (const candidate of candidates.items.filter(
      (item) => item.status === 'PROPOSED',
    )) {
      drafts.push(
        createInsightDraft(
          'POSSIBLE_RECURRING_PAYMENT',
          'INFO',
          'Možná opakovaná platba',
          'Podobná platba se opakuje v pravidelném intervalu. Potvrzení vytvoří pouze analytickou evidenci.',
          { periodStart, periodEnd, currencyCode: input.currencyCode },
          {
            kind: 'recurring-candidate',
            candidateId: candidate.id,
            frequency: candidate.detectedFrequency,
            occurrenceCount: candidate.evidenceTransactionCount,
          },
        ),
      );
    }
    const generated = await this.insights.upsertMany(
      membership.householdId,
      drafts,
    );
    return {
      generated,
      recurringCandidatesDetected: recurring.detected,
      ...(await this.list(userId, { currencyCode: input.currencyCode })),
    };
  }

  public async acknowledge(userId: string, insightId: string) {
    return this.changeStatus(userId, insightId, 'ACKNOWLEDGED');
  }

  public async dismiss(userId: string, insightId: string) {
    return this.changeStatus(userId, insightId, 'DISMISSED');
  }

  private async changeStatus(
    userId: string,
    insightId: string,
    status: 'ACKNOWLEDGED' | 'DISMISSED',
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    if (
      !(await this.insights.setStatus(
        membership.householdId,
        userId,
        insightId,
        status,
      ))
    )
      throw financeBudgetNotFound();
    return { id: insightId, status };
  }
}

export { budgetInsightDrafts } from '../domain/budget-insight-detection.js';
export { detectInsights } from '../domain/spending-insight-detection.js';
