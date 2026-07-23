import { Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  FINANCE_MANAGE_ROLE,
  FINANCE_READ_ROLE,
} from '../domain/finance-access.policy.js';
import { financeInvalid, financeNotFound } from '../domain/finance.errors.js';
import { PrismaFinancialAccountRepository } from '../infrastructure/prisma-financial-account.repository.js';
import { PrismaFinancialCategoryRepository } from '../infrastructure/prisma-financial-category.repository.js';
import type {
  CreateFinancialAccountDto,
  UpdateFinancialAccountDto,
} from '../presentation/dto/financial-account.dto.js';
import type {
  CreateFinancialCategoryDto,
  UpdateFinancialCategoryDto,
} from '../presentation/dto/financial-category.dto.js';
import {
  financeCatalogConflictFrom,
  validateCreditCardFields,
} from './finance-catalog.validation.js';

@Injectable()
export class FinanceCatalogService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly accounts: PrismaFinancialAccountRepository,
    private readonly categories: PrismaFinancialCategoryRepository,
  ) {}

  public async listAccounts(userId: string, includeArchived = false) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    return {
      items: await this.accounts.list(membership.householdId, includeArchived),
    };
  }

  public async accountDetail(userId: string, accountId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    const account = await this.accounts.detail(
      membership.householdId,
      accountId,
    );
    if (!account) throw financeNotFound();
    return account;
  }

  public async createAccount(userId: string, input: CreateFinancialAccountDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_MANAGE_ROLE,
    );
    validateCreditCardFields(input.type, input);
    try {
      const id = await this.accounts.create(
        membership.householdId,
        userId,
        input,
      );
      return await this.accountDetail(userId, id);
    } catch (error) {
      throw financeCatalogConflictFrom(
        error,
        'Účet s tímto názvem již existuje.',
      );
    }
  }

  public async updateAccount(
    userId: string,
    accountId: string,
    input: UpdateFinancialAccountDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_MANAGE_ROLE,
    );
    const current = await this.accounts.detail(
      membership.householdId,
      accountId,
    );
    if (!current) throw financeNotFound();
    validateCreditCardFields(input.type ?? current.type, {
      creditLimitMinor:
        input.creditLimitMinor === undefined
          ? current.creditLimitMinor
          : input.creditLimitMinor,
      statementDayOfMonth:
        input.statementDayOfMonth === undefined
          ? current.statementDayOfMonth
          : input.statementDayOfMonth,
      paymentDueDayOfMonth:
        input.paymentDueDayOfMonth === undefined
          ? current.paymentDueDayOfMonth
          : input.paymentDueDayOfMonth,
      maskedIdentifier:
        input.maskedIdentifier === undefined
          ? current.maskedIdentifier
          : input.maskedIdentifier,
    });
    if (
      input.currencyCode &&
      input.currencyCode !== current.currencyCode &&
      current.transactionCount > 0
    ) {
      throw financeInvalid('Měnu účtu s transakcemi nelze změnit.');
    }
    try {
      if (
        !(await this.accounts.update(
          membership.householdId,
          userId,
          accountId,
          input,
        ))
      ) {
        throw financeNotFound();
      }
      return await this.accountDetail(userId, accountId);
    } catch (error) {
      throw financeCatalogConflictFrom(
        error,
        'Účet s tímto názvem již existuje.',
      );
    }
  }

  public async setAccountArchived(
    userId: string,
    accountId: string,
    archived: boolean,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_MANAGE_ROLE,
    );
    if (
      !(await this.accounts.setArchived(
        membership.householdId,
        userId,
        accountId,
        archived,
      ))
    ) {
      throw financeNotFound();
    }
    return this.accountDetail(userId, accountId);
  }

  public async listCategories(userId: string, includeArchived = false) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    return {
      items: await this.categories.list(
        membership.householdId,
        includeArchived,
      ),
    };
  }

  public async createCategory(
    userId: string,
    input: CreateFinancialCategoryDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_MANAGE_ROLE,
    );
    await this.validateCategoryParent(
      membership.householdId,
      input.parentId ?? null,
      null,
    );
    try {
      const id = await this.categories.create(
        membership.householdId,
        userId,
        input,
      );
      return { id };
    } catch (error) {
      throw financeCatalogConflictFrom(
        error,
        'Kategorie s tímto názvem již existuje.',
      );
    }
  }

  public async updateCategory(
    userId: string,
    categoryId: string,
    input: UpdateFinancialCategoryDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_MANAGE_ROLE,
    );
    const current = await this.categories.findRecord(
      membership.householdId,
      categoryId,
    );
    if (!current) throw financeNotFound();
    if (input.parentId !== undefined) {
      await this.validateCategoryParent(
        membership.householdId,
        input.parentId,
        categoryId,
      );
      if (current.children.length > 0 && input.parentId !== null) {
        throw financeInvalid(
          'Kategorie s podkategoriemi musí zůstat v kořeni.',
        );
      }
    }
    try {
      if (
        !(await this.categories.update(
          membership.householdId,
          userId,
          categoryId,
          input,
        ))
      ) {
        throw financeNotFound();
      }
      return { id: categoryId };
    } catch (error) {
      throw financeCatalogConflictFrom(
        error,
        'Kategorie s tímto názvem již existuje.',
      );
    }
  }

  public async archiveCategory(userId: string, categoryId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_MANAGE_ROLE,
    );
    const category = await this.categories.findRecord(
      membership.householdId,
      categoryId,
    );
    if (!category) throw financeNotFound();
    if (category.children.length > 0) {
      throw financeInvalid('Nejprve archivujte podkategorie.');
    }
    if (
      !(await this.categories.archive(
        membership.householdId,
        userId,
        categoryId,
      ))
    ) {
      throw financeNotFound();
    }
    return { id: categoryId };
  }

  public async createRecommendedCategories(userId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_MANAGE_ROLE,
    );
    return {
      createdCount: await this.categories.createRecommended(
        membership.householdId,
        userId,
      ),
    };
  }

  private async validateCategoryParent(
    householdId: string,
    parentId: string | null,
    categoryId: string | null,
  ) {
    if (!parentId) return;
    if (parentId === categoryId)
      throw financeInvalid('Kategorie nemůže být sama sobě nadřazená.');
    const parent = await this.categories.findRecord(householdId, parentId);
    if (!parent || parent.archivedAt) throw financeNotFound();
    if (parent.parentId)
      throw financeInvalid('Kategorie mohou mít nejvýše dvě úrovně.');
  }
}
