import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { FINANCE_READ_ROLE } from '../../finance/domain/finance-access.policy.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import type { FinanceAnalyticsQueryDto } from '../presentation/dto/finance-analytics-query.dto.js';

export interface AnalyticsPeriod {
  from: Date;
  to: Date;
}

@Injectable()
export class FinanceAnalyticsQueryService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
  ) {}

  public async load(
    userId: string,
    query: FinanceAnalyticsQueryDto,
    period: AnalyticsPeriod,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    return this.loadForHousehold(membership.householdId, query, period);
  }

  public async loadComparison(
    userId: string,
    query: FinanceAnalyticsQueryDto,
    current: AnalyticsPeriod,
    previous: AnalyticsPeriod,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    const combinedPeriod = {
      from:
        current.from.getTime() < previous.from.getTime()
          ? current.from
          : previous.from,
      to:
        current.to.getTime() > previous.to.getTime() ? current.to : previous.to,
    };
    const rows = await this.loadForHousehold(
      membership.householdId,
      query,
      combinedPeriod,
    );

    return {
      currentRows: rows.filter((row) =>
        isWithinPeriod(row.bookedDate, current),
      ),
      previousRows: rows.filter((row) =>
        isWithinPeriod(row.bookedDate, previous),
      ),
    };
  }

  private loadForHousehold(
    householdId: string,
    query: FinanceAnalyticsQueryDto,
    period: AnalyticsPeriod,
  ) {
    const where: Prisma.FinancialTransactionWhereInput = {
      householdId,
      deletedAt: null,
      bookedDate: { gte: period.from, lte: period.to },
      type: { in: ['EXPENSE', 'REFUND', 'INCOME'] },
      ...(query.currencyCode ? { currencyCode: query.currencyCode } : {}),
      ...(query.accountIds?.length
        ? { accountId: { in: query.accountIds } }
        : {}),
      ...(query.categoryIds?.length
        ? { categoryId: { in: query.categoryIds } }
        : {}),
      ...(!query.includeCreditCards
        ? { account: { type: { not: 'CREDIT_CARD' } } }
        : {}),
    };
    return this.prisma.financialTransaction.findMany({
      where,
      orderBy: [{ bookedDate: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        accountId: true,
        type: true,
        amountMinor: true,
        currencyCode: true,
        bookedDate: true,
        merchantNormalizedName: true,
        counterpartyName: true,
        category: { select: { id: true, name: true } },
      },
    });
  }
}

const isWithinPeriod = (date: Date, period: AnalyticsPeriod) =>
  date.getTime() >= period.from.getTime() &&
  date.getTime() <= period.to.getTime();

export type AnalyticsTransaction = Awaited<
  ReturnType<FinanceAnalyticsQueryService['load']>
>[number];
