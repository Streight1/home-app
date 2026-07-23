import { Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  FINANCE_READ_ROLE,
  FINANCE_WRITE_ROLE,
} from '../../finance/domain/finance-access.policy.js';
import { dateOnly } from '../../finance/domain/finance.types.js';
import {
  financeBudgetConflict,
  financeBudgetInvalid,
  financeBudgetNotFound,
} from '../domain/finance-budget.errors.js';
import {
  mapBudget,
  PrismaBudgetRepository,
} from '../infrastructure/prisma-budget.repository.js';
import type {
  CopyBudgetDto,
  CreateBudgetDto,
  ListBudgetsQueryDto,
  UpdateBudgetDto,
} from '../presentation/dto/budget.dto.js';

@Injectable()
export class BudgetService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly budgets: PrismaBudgetRepository,
  ) {}

  public async list(userId: string, query: ListBudgetsQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    return {
      items: (await this.budgets.list(membership.householdId, query)).map(
        mapBudget,
      ),
    };
  }

  public async detail(userId: string, budgetId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    const budget = await this.budgets.find(membership.householdId, budgetId);
    if (!budget) throw financeBudgetNotFound();
    return mapBudget(budget);
  }

  public async create(userId: string, input: CreateBudgetDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    await this.validate(membership.householdId, input);
    try {
      const id = await this.budgets.create(
        membership.householdId,
        userId,
        input,
      );
      return await this.detail(userId, id);
    } catch (error) {
      if (isUniqueConstraint(error))
        throw financeBudgetConflict(
          'Aktivní rozpočet pro toto období a měnu již existuje.',
        );
      throw error;
    }
  }

  public async update(
    userId: string,
    budgetId: string,
    input: UpdateBudgetDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const current = await this.budgets.find(membership.householdId, budgetId);
    if (!current) throw financeBudgetNotFound();
    if (current.status === 'CLOSED')
      throw financeBudgetInvalid('Uzavřený rozpočet již nelze měnit.');
    if (input.allocations)
      await this.validateAllocations(membership.householdId, input.allocations);
    try {
      if (
        !(await this.budgets.update(
          membership.householdId,
          userId,
          budgetId,
          input,
        ))
      )
        throw financeBudgetNotFound();
      return await this.detail(userId, budgetId);
    } catch (error) {
      if (isUniqueConstraint(error))
        throw financeBudgetConflict(
          'Aktivní rozpočet pro toto období a měnu již existuje.',
        );
      throw error;
    }
  }

  public async archive(userId: string, budgetId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    if (!(await this.budgets.archive(membership.householdId, userId, budgetId)))
      throw financeBudgetNotFound();
    return { id: budgetId, status: 'ARCHIVED' as const };
  }

  public async copy(userId: string, budgetId: string, input: CopyBudgetDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const source = await this.budgets.find(membership.householdId, budgetId);
    if (!source) throw financeBudgetNotFound();
    const requested = dateOnly(input.targetMonth);
    const targetStart = new Date(
      Date.UTC(requested.getUTCFullYear(), requested.getUTCMonth(), 1),
    );
    const targetEnd = new Date(
      Date.UTC(requested.getUTCFullYear(), requested.getUTCMonth() + 1, 0),
    );
    const requestedName =
      input.name?.trim() ??
      `Rozpočet ${String(targetStart.getUTCMonth() + 1)}/${String(targetStart.getUTCFullYear())}`;
    const id = await this.budgets.copy({
      householdId: membership.householdId,
      userId,
      source,
      targetStart,
      targetEnd,
      name: requestedName,
    });
    if (!id)
      throw financeBudgetConflict('Rozpočet pro cílový měsíc již existuje.');
    return this.detail(userId, id);
  }

  private async validate(householdId: string, input: CreateBudgetDto) {
    const start = dateOnly(input.periodStart);
    const end = dateOnly(input.periodEnd);
    if (end < start)
      throw financeBudgetInvalid('Konec období nesmí být před začátkem.');
    if (input.periodType === 'MONTHLY') {
      const expectedEnd = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
      );
      if (start.getUTCDate() !== 1 || end.getTime() !== expectedEnd.getTime())
        throw financeBudgetInvalid(
          'Měsíční rozpočet musí pokrývat celý kalendářní měsíc.',
        );
    }
    await this.validateAllocations(householdId, input.allocations);
  }

  private async validateAllocations(
    householdId: string,
    allocations: readonly { categoryId: string }[],
  ) {
    const unique = [
      ...new Set(allocations.map((allocation) => allocation.categoryId)),
    ];
    if (unique.length !== allocations.length)
      throw financeBudgetInvalid(
        'Každá kategorie smí být v rozpočtu pouze jednou.',
      );
    const categories = await this.budgets.listCategories(householdId, unique);
    if (
      categories.length !== unique.length ||
      categories.some(
        (category) =>
          category.archivedAt !== null ||
          !['EXPENSE', 'BOTH'].includes(category.kind),
      )
    )
      throw financeBudgetInvalid(
        'Rozpočet může použít jen výdajovou kategorii této domácnosti.',
      );
  }
}

const isUniqueConstraint = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';
