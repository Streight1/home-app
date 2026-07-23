import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { HouseholdAccessService } from '../households/household-access.service.js';
import { FINANCE_READ_ROLE } from '../finance/domain/finance-access.policy.js';
import {
  matchCategorizationRule,
  type CategorizationCandidate,
} from './domain/categorization-rule.matcher.js';

@Injectable()
export class FinanceCategorizationFacade {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
  ) {}

  public async categorize(
    userId: string,
    candidates: readonly CategorizationCandidate[],
  ): Promise<(string | null)[]> {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    const rules = await this.prisma.financialCategorizationRule.findMany({
      where: { householdId: membership.householdId, enabled: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: {
        categoryId: true,
        accountId: true,
        transactionType: true,
        field: true,
        operator: true,
        normalizedComparisonValue: true,
      },
    });
    return candidates.map((candidate) =>
      matchCategorizationRule(candidate, rules),
    );
  }
}
