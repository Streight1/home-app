import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { FINANCE_READ_ROLE } from '../domain/finance-access.policy.js';
import {
  FINANCE_CLOCK_PORT,
  type FinanceClockPort,
} from '../domain/finance-clock.port.js';
import { financeInvalid } from '../domain/finance.errors.js';
import { dateOnly, dateOnlyString } from '../domain/finance.types.js';
import { PrismaFinancialAccountRepository } from '../infrastructure/prisma-financial-account.repository.js';
import { PrismaFinancialTransactionRepository } from '../infrastructure/prisma-financial-transaction.repository.js';
import type { FinancePeriodDto } from '../presentation/dto/list-financial-transactions.dto.js';

interface CurrencyAggregate {
  income: bigint;
  expenses: bigint;
  uncategorizedExpenseCount: number;
  categories: Map<string, { categoryId: string; name: string; amount: bigint }>;
}

@Injectable()
export class FinanceReportingService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly accounts: PrismaFinancialAccountRepository,
    private readonly transactions: PrismaFinancialTransactionRepository,
    @Inject(FINANCE_CLOCK_PORT) private readonly clock: FinanceClockPort,
  ) {}

  public async summary(userId: string, period: FinancePeriodDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    const { from, to } = resolveFinancePeriod(period, this.clock.now());
    const [transactions, accounts] = await Promise.all([
      this.transactions.listForReport(membership.householdId, from, to),
      this.accounts.list(membership.householdId, true),
    ]);
    const aggregates = new Map<string, CurrencyAggregate>();
    for (const account of accounts) {
      if (!aggregates.has(account.currencyCode)) {
        aggregates.set(account.currencyCode, {
          income: 0n,
          expenses: 0n,
          uncategorizedExpenseCount: 0,
          categories: new Map(),
        });
      }
    }
    for (const transaction of transactions) {
      const current: CurrencyAggregate = aggregates.get(
        transaction.currencyCode,
      ) ?? {
        income: 0n,
        expenses: 0n,
        uncategorizedExpenseCount: 0,
        categories: new Map<
          string,
          { categoryId: string; name: string; amount: bigint }
        >(),
      };
      if (transaction.type === 'INCOME')
        current.income += transaction.amountMinor;
      if (transaction.type === 'EXPENSE' || transaction.type === 'REFUND') {
        const signedAmount =
          transaction.type === 'REFUND'
            ? -transaction.amountMinor
            : transaction.amountMinor;
        current.expenses += signedAmount;
        if (!transaction.category && transaction.type === 'EXPENSE')
          current.uncategorizedExpenseCount += 1;
        else {
          if (!transaction.category) {
            aggregates.set(transaction.currencyCode, current);
            continue;
          }
          const category = current.categories.get(transaction.category.id) ?? {
            categoryId: transaction.category.id,
            name: transaction.category.name,
            amount: 0n,
          };
          category.amount += signedAmount;
          current.categories.set(category.categoryId, category);
        }
      }
      aggregates.set(transaction.currencyCode, current);
    }
    return {
      period: { dateFrom: dateOnlyString(from), dateTo: dateOnlyString(to) },
      currencies: [...aggregates.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([currencyCode, aggregate]) => ({
          currencyCode,
          incomeMinor: aggregate.income.toString(),
          expenseMinor: aggregate.expenses.toString(),
          netMinor: (aggregate.income - aggregate.expenses).toString(),
          uncategorizedExpenseCount: aggregate.uncategorizedExpenseCount,
          topExpenseCategories: [...aggregate.categories.values()]
            .sort((left, right) =>
              left.amount > right.amount
                ? -1
                : left.amount < right.amount
                  ? 1
                  : 0,
            )
            .slice(0, 5)
            .map((category) => {
              const share =
                aggregate.expenses === 0n
                  ? 0n
                  : (category.amount * 10_000n) / aggregate.expenses;
              return {
                categoryId: category.categoryId,
                name: category.name,
                amountMinor: category.amount.toString(),
                shareBasisPoints: Number(share),
              };
            }),
        })),
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        currencyCode: account.currencyCode,
        currentBalanceMinor: account.currentBalanceMinor,
        archived: account.archivedAt !== null,
      })),
    };
  }

  public async dashboard(userId: string) {
    const report = await this.summary(userId, {});
    return {
      period: report.period,
      currencies: report.currencies.map((currency) => ({
        currencyCode: currency.currencyCode,
        incomeMinor: currency.incomeMinor,
        expenseMinor: currency.expenseMinor,
        netMinor: currency.netMinor,
        uncategorizedExpenseCount: currency.uncategorizedExpenseCount,
        topExpenseCategory: currency.topExpenseCategories[0] ?? null,
      })),
      accounts: report.accounts
        .filter((account) => !account.archived)
        .slice(0, 5),
      navigationTarget: { area: 'finance', screen: 'overview' },
    };
  }
}

export const resolveFinancePeriod = (input: FinancePeriodDto, now: Date) => {
  const firstDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const lastDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  );
  const from = input.dateFrom ? dateOnly(input.dateFrom) : firstDay;
  const to = input.dateTo ? dateOnly(input.dateTo) : lastDay;
  if (from > to) {
    throw financeInvalid('Začátek období nesmí být po jeho konci.');
  }
  return { from, to };
};
