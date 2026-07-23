import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { FinanceLedgerFacade } from '../../finance/finance-ledger.facade.js';
import {
  FINANCE_READ_ROLE,
  FINANCE_WRITE_ROLE,
} from '../../finance/domain/finance-access.policy.js';
import { financeNotFound } from '../../finance/domain/finance.errors.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { normalizeRuleValue } from '../domain/merchant-normalizer.js';
import type {
  BulkCategorizeDto,
  CreateCategorizationRuleDto,
  UpdateCategorizationRuleDto,
} from '../presentation/dto/categorization-rule.dto.js';

@Injectable()
export class FinanceCategorizationService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly ledger: FinanceLedgerFacade,
    private readonly audit: AuditService,
  ) {}

  public async list(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    return {
      items: await this.prisma.financialCategorizationRule.findMany({
        where: { householdId: membership.householdId },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          priority: true,
          enabled: true,
          field: true,
          operator: true,
          comparisonValue: true,
          categoryId: true,
          accountId: true,
          transactionType: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    };
  }

  public async create(userId: string, input: CreateCategorizationRuleDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    await this.ledger.verifyCategory(
      userId,
      input.categoryId,
      input.transactionType ?? 'EXPENSE',
    );
    if (input.accountId)
      await this.ledger.getAccount(userId, input.accountId, true);
    return this.prisma.$transaction(async (transaction) => {
      const rule = await transaction.financialCategorizationRule.create({
        data: Object.assign({}, input, {
          accountId: input.accountId ?? null,
          transactionType: input.transactionType ?? null,
          householdId: membership.householdId,
          normalizedComparisonValue: normalizeRuleValue(input.comparisonValue),
          createdByUserId: userId,
        }),
        select: { id: true },
      });
      await this.audit.record(transaction, {
        action: 'FINANCE_CATEGORIZATION_RULE_CREATED',
        householdId: membership.householdId,
        userId,
        entityType: 'FinancialCategorizationRule',
        entityId: rule.id,
        metadata: { ruleId: rule.id, categoryId: input.categoryId },
      });
      return rule;
    });
  }

  public async update(
    userId: string,
    ruleId: string,
    input: UpdateCategorizationRuleDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const existing = await this.prisma.financialCategorizationRule.findFirst({
      where: { id: ruleId, householdId: membership.householdId },
      select: { transactionType: true },
    });
    if (!existing) throw financeNotFound();
    if (input.categoryId) {
      const effectiveType =
        input.transactionType ??
        (existing.transactionType === 'INCOME' ||
        existing.transactionType === 'REFUND'
          ? existing.transactionType
          : 'EXPENSE');
      await this.ledger.verifyCategory(userId, input.categoryId, effectiveType);
    }
    if (input.accountId)
      await this.ledger.getAccount(userId, input.accountId, true);
    const result = await this.prisma.financialCategorizationRule.updateMany({
      where: { id: ruleId, householdId: membership.householdId },
      data: Object.assign(
        {},
        input,
        input.comparisonValue
          ? {
              normalizedComparisonValue: normalizeRuleValue(
                input.comparisonValue,
              ),
            }
          : {},
      ),
    });
    if (result.count === 0) throw financeNotFound();
    await this.prisma.$transaction((transaction) =>
      this.audit.record(transaction, {
        action: 'FINANCE_CATEGORIZATION_RULE_UPDATED',
        householdId: membership.householdId,
        userId,
        entityType: 'FinancialCategorizationRule',
        entityId: ruleId,
        metadata: { ruleId, changedFields: Object.keys(input).sort() },
      }),
    );
    return { id: ruleId };
  }

  public async delete(userId: string, ruleId: string): Promise<void> {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const result = await this.prisma.financialCategorizationRule.deleteMany({
      where: { id: ruleId, householdId: membership.householdId },
    });
    if (result.count === 0) throw financeNotFound();
    await this.prisma.$transaction((transaction) =>
      this.audit.record(transaction, {
        action: 'FINANCE_CATEGORIZATION_RULE_DELETED',
        householdId: membership.householdId,
        userId,
        entityType: 'FinancialCategorizationRule',
        entityId: ruleId,
        metadata: { ruleId },
      }),
    );
  }

  public async bulkCategorize(userId: string, input: BulkCategorizeDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    await this.ledger.verifyCategory(userId, input.categoryId, 'EXPENSE');
    const result = await this.prisma.financialTransaction.updateMany({
      where: {
        id: { in: input.transactionIds },
        householdId: membership.householdId,
        deletedAt: null,
        type: { in: ['EXPENSE', 'REFUND'] },
      },
      data: { categoryId: input.categoryId, updatedByUserId: userId },
    });
    return { updatedCount: result.count };
  }
}
