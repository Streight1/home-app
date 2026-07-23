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
    const where: Prisma.FinancialTransactionWhereInput = {
      householdId: membership.householdId,
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

export type AnalyticsTransaction = Awaited<
  ReturnType<FinanceAnalyticsQueryService['load']>
>[number];
