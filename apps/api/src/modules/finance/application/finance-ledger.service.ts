import { Injectable } from '@nestjs/common';
import {
  DocumentsFacade,
  type SafeDocumentSummary,
} from '../../documents/documents.facade.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  FINANCE_READ_ROLE,
  FINANCE_WRITE_ROLE,
} from '../domain/finance-access.policy.js';
import { financeInvalid, financeNotFound } from '../domain/finance.errors.js';
import {
  dateOnlyString,
  type ManualTransactionType,
} from '../domain/finance.types.js';
import { isCategoryKindAllowed } from '../domain/ledger-rules.js';
import { PrismaFinancialAccountRepository } from '../infrastructure/prisma-financial-account.repository.js';
import { PrismaFinancialCategoryRepository } from '../infrastructure/prisma-financial-category.repository.js';
import type { FinancialTransactionRecord } from '../infrastructure/financial-transaction-record.js';
import { PrismaFinancialTransactionRepository } from '../infrastructure/prisma-financial-transaction.repository.js';
import type {
  CreateFinancialTransactionDto,
  UpdateFinancialTransactionDocumentsDto,
  UpdateFinancialTransactionDto,
} from '../presentation/dto/financial-transaction.dto.js';
import type { ListFinancialTransactionsDto } from '../presentation/dto/list-financial-transactions.dto.js';
import { mapFinancialTransaction } from './financial-response.mapper.js';

@Injectable()
export class FinanceLedgerService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly accounts: PrismaFinancialAccountRepository,
    private readonly categories: PrismaFinancialCategoryRepository,
    private readonly transactions: PrismaFinancialTransactionRepository,
    private readonly documents: DocumentsFacade,
  ) {}

  public async list(userId: string, query: ListFinancialTransactionsDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    const result = await this.transactions.list(membership.householdId, query);
    const documentMap = await this.documentMap(userId, result.items);
    return {
      items: result.items.map((transaction) =>
        mapFinancialTransaction(transaction, documentMap),
      ),
      pagination: result.pagination,
    };
  }

  public async detail(userId: string, transactionId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_READ_ROLE,
    );
    const transaction = await this.transactions.findRecord(
      membership.householdId,
      transactionId,
    );
    if (!transaction) throw financeNotFound();
    return mapFinancialTransaction(
      transaction,
      await this.documentMap(userId, [transaction]),
    );
  }

  public async create(
    userId: string,
    type: ManualTransactionType,
    input: CreateFinancialTransactionDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const account = await this.requireActiveAccount(
      membership.householdId,
      input.accountId,
    );
    await this.validateCategory(
      membership.householdId,
      input.categoryId ?? null,
      type,
    );
    await this.documents.verifyAccessibleSummaries(userId, input.documentIds);
    const id = await this.transactions.create({
      householdId: membership.householdId,
      userId,
      type,
      currencyCode: account.currencyCode,
      data: input,
    });
    return this.detail(userId, id);
  }

  public async update(
    userId: string,
    transactionId: string,
    input: UpdateFinancialTransactionDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const existing = await this.transactions.findRecord(
      membership.householdId,
      transactionId,
    );
    if (!existing) throw financeNotFound();
    if (existing.transferId || existing.source !== 'MANUAL') {
      throw financeInvalid('Tento účetní zápis nelze upravit samostatně.');
    }
    const merged: CreateFinancialTransactionDto = {
      accountId: input.accountId ?? existing.accountId,
      categoryId:
        input.categoryId === undefined ? existing.categoryId : input.categoryId,
      amountMinor: input.amountMinor ?? existing.amountMinor.toString(),
      bookedDate: input.bookedDate ?? dateOnlyString(existing.bookedDate),
      counterpartyName:
        input.counterpartyName === undefined
          ? existing.counterpartyName
          : input.counterpartyName,
      counterpartyAccount:
        input.counterpartyAccount === undefined
          ? existing.counterpartyAccount
          : input.counterpartyAccount,
      description:
        input.description === undefined
          ? existing.description
          : input.description,
      variableSymbol:
        input.variableSymbol === undefined
          ? existing.variableSymbol
          : input.variableSymbol,
      constantSymbol:
        input.constantSymbol === undefined
          ? existing.constantSymbol
          : input.constantSymbol,
      specificSymbol:
        input.specificSymbol === undefined
          ? existing.specificSymbol
          : input.specificSymbol,
      note: input.note === undefined ? existing.note : input.note,
      documentIds:
        input.documentIds ??
        existing.documents.map(({ documentId }) => documentId),
    };
    const type = existing.type === 'INCOME' ? 'INCOME' : 'EXPENSE';
    const account = await this.requireActiveAccount(
      membership.householdId,
      merged.accountId,
    );
    await this.validateCategory(
      membership.householdId,
      merged.categoryId ?? null,
      type,
    );
    await this.documents.verifyAccessibleSummaries(userId, merged.documentIds);
    if (
      !(await this.transactions.update({
        householdId: membership.householdId,
        userId,
        transactionId,
        data: merged,
        currencyCode: account.currencyCode,
      }))
    ) {
      throw financeNotFound();
    }
    return this.detail(userId, transactionId);
  }

  public async replaceDocuments(
    userId: string,
    transactionId: string,
    input: UpdateFinancialTransactionDocumentsDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    await this.documents.verifyAccessibleSummaries(userId, input.documentIds);
    if (
      !(await this.transactions.replaceDocuments(
        membership.householdId,
        userId,
        transactionId,
        input.documentIds,
      ))
    ) {
      throw financeNotFound();
    }
    return this.detail(userId, transactionId);
  }

  public async delete(userId: string, transactionId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      FINANCE_WRITE_ROLE,
    );
    const transaction = await this.transactions.findRecord(
      membership.householdId,
      transactionId,
    );
    if (!transaction) throw financeNotFound();
    if (transaction.transferId) {
      throw financeInvalid('Převod je nutné odstranit jako celek.');
    }
    if (
      !(await this.transactions.softDelete(
        membership.householdId,
        userId,
        transactionId,
      ))
    ) {
      throw financeNotFound();
    }
  }

  private async requireActiveAccount(householdId: string, accountId: string) {
    const account = await this.accounts.findRecord(householdId, accountId);
    if (!account) throw financeNotFound();
    if (account.archivedAt)
      throw financeInvalid('Archivovaný účet nelze použít.');
    return account;
  }

  private async validateCategory(
    householdId: string,
    categoryId: string | null,
    type: ManualTransactionType,
  ) {
    if (!categoryId) return;
    const category = await this.categories.findRecord(householdId, categoryId);
    if (!category) throw financeNotFound();
    if (category.archivedAt)
      throw financeInvalid('Archivovanou kategorii nelze použít.');
    if (!isCategoryKindAllowed(category.kind, type)) {
      throw financeInvalid('Kategorie neodpovídá typu transakce.');
    }
  }

  private async documentMap(
    userId: string,
    transactions: readonly FinancialTransactionRecord[],
  ): Promise<Map<string, SafeDocumentSummary>> {
    const ids = [
      ...new Set(
        transactions.flatMap((item) =>
          item.documents.map(({ documentId }) => documentId),
        ),
      ),
    ];
    const documents = await this.documents.verifyAccessibleSummaries(
      userId,
      ids,
    );
    return new Map(documents.map((document) => [document.id, document]));
  }
}
