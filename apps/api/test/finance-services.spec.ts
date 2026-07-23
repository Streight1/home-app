import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import type { AuditService } from '../src/modules/audit/audit.service.js';
import type { DocumentsFacade } from '../src/modules/documents/documents.facade.js';
import { FinanceCatalogService } from '../src/modules/finance/application/finance-catalog.service.js';
import { FinanceLedgerService } from '../src/modules/finance/application/finance-ledger.service.js';
import {
  FinanceReportingService,
  resolveFinancePeriod,
} from '../src/modules/finance/application/finance-reporting.service.js';
import type { FinanceClockPort } from '../src/modules/finance/domain/finance-clock.port.js';
import { recommendedFinanceCategories } from '../src/modules/finance/domain/finance.types.js';
import type { PrismaFinancialAccountRepository } from '../src/modules/finance/infrastructure/prisma-financial-account.repository.js';
import { PrismaFinancialCategoryRepository } from '../src/modules/finance/infrastructure/prisma-financial-category.repository.js';
import { PrismaFinancialTransactionRepository } from '../src/modules/finance/infrastructure/prisma-financial-transaction.repository.js';
import { PrismaFinancialTransferRepository } from '../src/modules/finance/infrastructure/prisma-financial-transfer.repository.js';
import { ListFinancialTransactionsDto } from '../src/modules/finance/presentation/dto/list-financial-transactions.dto.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';

const householdId = '10000000-0000-4000-8000-000000000001';
const userId = '20000000-0000-4000-8000-000000000002';
const accountId = '30000000-0000-4000-8000-000000000003';
const categoryId = '40000000-0000-4000-8000-000000000004';
const transactionId = '50000000-0000-4000-8000-000000000005';
const documentId = '60000000-0000-4000-8000-000000000006';

const membershipAccess = () =>
  ({
    getActiveMembership: vi
      .fn()
      .mockResolvedValue({ householdId, role: 'MEMBER' }),
  }) as unknown as HouseholdAccessService;

const accountRecord = (overrides: Record<string, unknown> = {}) => ({
  id: accountId,
  householdId,
  name: 'Běžný účet',
  normalizedName: 'běžný účet',
  type: 'CURRENT',
  currencyCode: 'CZK',
  openingBalanceMinor: 10_000n,
  openingBalanceDate: new Date('2026-07-01T00:00:00.000Z'),
  description: null,
  colorToken: 'violet',
  iconKey: 'landmark',
  createdByUserId: userId,
  updatedByUserId: userId,
  archivedAt: null,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  transactions: [],
  ...overrides,
});

const categoryRecord = (overrides: Record<string, unknown> = {}) => ({
  id: categoryId,
  householdId,
  parentId: null,
  name: 'Potraviny',
  normalizedName: 'potraviny',
  kind: 'EXPENSE',
  colorToken: 'green',
  iconKey: 'cart',
  sortOrder: 0,
  createdByUserId: userId,
  archivedAt: null,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  parent: null,
  children: [],
  ...overrides,
});

const transactionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: transactionId,
  householdId,
  accountId,
  categoryId,
  transferId: null,
  type: 'EXPENSE',
  source: 'MANUAL',
  amountMinor: 124_950n,
  currencyCode: 'CZK',
  bookedDate: new Date('2026-07-16T00:00:00.000Z'),
  counterpartyName: 'Obchod',
  counterpartyAccount: null,
  description: null,
  variableSymbol: null,
  constantSymbol: null,
  specificSymbol: null,
  note: null,
  createdByUserId: userId,
  updatedByUserId: userId,
  deletedByUserId: null,
  deletedAt: null,
  createdAt: new Date('2026-07-16T10:00:00.000Z'),
  updatedAt: new Date('2026-07-16T10:00:00.000Z'),
  account: accountRecord(),
  category: categoryRecord(),
  transfer: null,
  documents: [{ documentId }],
  ...overrides,
});

const transactionInput = {
  accountId,
  categoryId,
  amountMinor: '124950',
  bookedDate: '2026-07-16',
  counterpartyName: 'Obchod',
  documentIds: [documentId],
};

function ledgerContext(
  options: {
    account?: unknown;
    category?: unknown;
    documentsReject?: Error;
  } = {},
) {
  const accounts = {
    findRecord: vi
      .fn()
      .mockResolvedValue(
        options.account === undefined ? accountRecord() : options.account,
      ),
  };
  const categories = {
    findRecord: vi
      .fn()
      .mockResolvedValue(
        options.category === undefined ? categoryRecord() : options.category,
      ),
  };
  const transactions = {
    create: vi.fn().mockResolvedValue(transactionId),
    findRecord: vi.fn().mockResolvedValue(transactionRecord()),
    list: vi.fn(),
    update: vi.fn(),
    replaceDocuments: vi.fn(),
    softDelete: vi.fn(),
  };
  const documents = {
    verifyAccessibleSummaries: options.documentsReject
      ? vi.fn().mockRejectedValue(options.documentsReject)
      : vi.fn().mockResolvedValue([
          {
            id: documentId,
            type: 'RECEIPT',
            primaryLabel: 'Účtenka',
            canPreview: true,
          },
        ]),
  };
  return {
    service: new FinanceLedgerService(
      membershipAccess(),
      accounts as unknown as PrismaFinancialAccountRepository,
      categories as unknown as PrismaFinancialCategoryRepository,
      transactions as unknown as PrismaFinancialTransactionRepository,
      documents as unknown as DocumentsFacade,
    ),
    accounts,
    categories,
    transactions,
    documents,
  };
}

describe('finance ledger application boundaries', () => {
  it('allows a household member to create an expense with a safe document summary', async () => {
    const context = ledgerContext();
    const result = await context.service.create(
      userId,
      'EXPENSE',
      transactionInput,
    );
    expect(context.transactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        type: 'EXPENSE',
        currencyCode: 'CZK',
      }),
    );
    expect(result).toMatchObject({
      id: transactionId,
      amount: { amountMinor: '124950', currencyCode: 'CZK' },
      documents: [{ id: documentId, primaryLabel: 'Účtenka' }],
    });
  });

  it('rejects an account outside the current household with the generic finance 404', async () => {
    const context = ledgerContext({ account: null });
    await expect(
      context.service.create(userId, 'EXPENSE', transactionInput),
    ).rejects.toMatchObject({ code: 'FINANCE_NOT_FOUND' });
    expect(context.transactions.create).not.toHaveBeenCalled();
  });

  it('rejects a category outside the current household', async () => {
    const context = ledgerContext({ category: null });
    await expect(
      context.service.create(userId, 'EXPENSE', transactionInput),
    ).rejects.toMatchObject({ code: 'FINANCE_NOT_FOUND' });
  });

  it('rejects a document rejected by the DocumentsFacade', async () => {
    const context = ledgerContext({
      documentsReject: Object.assign(new Error('not found'), {
        code: 'DOCUMENT_NOT_FOUND',
      }),
    });
    await expect(
      context.service.create(userId, 'EXPENSE', transactionInput),
    ).rejects.toMatchObject({ code: 'DOCUMENT_NOT_FOUND' });
    expect(context.transactions.create).not.toHaveBeenCalled();
  });

  it('rejects an income-only category on an expense', async () => {
    const context = ledgerContext({
      category: categoryRecord({ kind: 'INCOME' }),
    });
    await expect(
      context.service.create(userId, 'EXPENSE', transactionInput),
    ).rejects.toMatchObject({ code: 'FINANCE_INVALID_INPUT' });
  });

  it('rejects an expense-only category on an income', async () => {
    const context = ledgerContext();
    await expect(
      context.service.create(userId, 'INCOME', transactionInput),
    ).rejects.toMatchObject({ code: 'FINANCE_INVALID_INPUT' });
  });

  it('rejects an archived account for a new transaction', async () => {
    const context = ledgerContext({
      account: accountRecord({ archivedAt: new Date() }),
    });
    await expect(
      context.service.create(userId, 'EXPENSE', transactionInput),
    ).rejects.toMatchObject({ code: 'FINANCE_INVALID_INPUT' });
  });

  it('keeps an archived category visible on historical detail', async () => {
    const context = ledgerContext();
    context.transactions.findRecord.mockResolvedValue(
      transactionRecord({
        category: categoryRecord({ archivedAt: new Date() }),
      }),
    );
    await expect(
      context.service.detail(userId, transactionId),
    ).resolves.toMatchObject({
      category: { id: categoryId, name: 'Potraviny' },
    });
  });

  it('does not allow deleting one side of a transfer as a manual transaction', async () => {
    const context = ledgerContext();
    context.transactions.findRecord.mockResolvedValue(
      transactionRecord({ transferId: '70000000-0000-4000-8000-000000000007' }),
    );
    await expect(
      context.service.delete(userId, transactionId),
    ).rejects.toMatchObject({
      code: 'FINANCE_INVALID_INPUT',
    });
    expect(context.transactions.softDelete).not.toHaveBeenCalled();
  });
});

describe('finance repositories and persistence contracts', () => {
  it('stores exact minor units, a real document relation and safe audit metadata', async () => {
    const create = vi.fn().mockResolvedValue({ id: transactionId });
    const transaction = { financialTransaction: { create } };
    const prisma = {
      $transaction: (callback: (value: typeof transaction) => unknown) =>
        callback(transaction),
    } as unknown as PrismaService;
    const audit = { record: vi.fn() } as unknown as AuditService;
    const repository = new PrismaFinancialTransactionRepository(prisma, audit);
    await repository.create({
      householdId,
      userId,
      type: 'EXPENSE',
      currencyCode: 'CZK',
      data: { ...transactionInput, note: 'Soukromá poznámka' },
    });
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amountMinor: 124_950n,
        documents: { create: [{ documentId, createdByUserId: userId }] },
      }),
    });
    const auditEvent = vi.mocked(audit.record).mock.calls[0]?.[1];
    expect(auditEvent).toMatchObject({
      action: 'FINANCIAL_TRANSACTION_CREATED',
    });
    expect(JSON.stringify(auditEvent?.metadata)).not.toContain(
      'Soukromá poznámka',
    );
    expect(JSON.stringify(auditEvent?.metadata)).not.toContain(
      'counterpartyAccount',
    );
  });

  it('creates both linked ledger entries in one transfer transaction', async () => {
    const createMany = vi.fn();
    const transaction = {
      financialTransfer: { create: vi.fn(), update: vi.fn() },
      financialTransaction: { createMany },
    };
    const prisma = {
      $transaction: (callback: (value: typeof transaction) => unknown) =>
        callback(transaction),
    } as unknown as PrismaService;
    const audit = { record: vi.fn() } as unknown as AuditService;
    const repository = new PrismaFinancialTransferRepository(prisma, audit);
    await repository.create({
      householdId,
      userId,
      currencyCode: 'CZK',
      data: {
        fromAccountId: accountId,
        toAccountId: '80000000-0000-4000-8000-000000000008',
        amountMinor: '5000',
        bookedDate: '2026-07-16',
        note: null,
      },
    });
    const rows = createMany.mock.calls[0]?.[0].data as {
      type: string;
      transferId: string;
      amountMinor: bigint;
    }[];
    expect(rows).toHaveLength(2);
    expect(rows.map(({ type }) => type).sort()).toEqual([
      'TRANSFER_IN',
      'TRANSFER_OUT',
    ]);
    expect(new Set(rows.map(({ transferId }) => transferId)).size).toBe(1);
    expect(rows.every(({ amountMinor }) => amountMinor === 5_000n)).toBe(true);
  });

  it('soft-deletes both sides of a transfer together', async () => {
    const updateMany = vi.fn();
    const transaction = {
      financialTransfer: {
        findFirst: vi.fn().mockResolvedValue({ id: transactionId }),
        update: vi.fn(),
      },
      financialTransaction: { updateMany },
    };
    const prisma = {
      $transaction: (callback: (value: typeof transaction) => unknown) =>
        callback(transaction),
    } as unknown as PrismaService;
    const audit = { record: vi.fn() } as unknown as AuditService;
    const repository = new PrismaFinancialTransferRepository(prisma, audit);
    await repository.softDelete(householdId, userId, transactionId);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { transferId: transactionId, householdId },
      }),
    );
  });

  it('creates recommended categories idempotently when every normalized name exists', async () => {
    const createMany = vi.fn();
    const transaction = {
      financialCategory: {
        findMany: vi.fn().mockResolvedValue(
          recommendedFinanceCategories.map((category) => ({
            normalizedName: category.name.toLocaleLowerCase('cs-CZ'),
          })),
        ),
        createMany,
      },
    };
    const prisma = {
      $transaction: (callback: (value: typeof transaction) => unknown) =>
        callback(transaction),
    } as unknown as PrismaService;
    const audit = { record: vi.fn() } as unknown as AuditService;
    const repository = new PrismaFinancialCategoryRepository(prisma, audit);
    await expect(
      repository.createRecommended(householdId, userId),
    ).resolves.toBe(0);
    expect(createMany).not.toHaveBeenCalled();
  });
});

describe('finance catalog, reporting and listing contracts', () => {
  it('refuses to change currency when an account already has ledger entries', async () => {
    const accounts = {
      detail: vi.fn().mockResolvedValue({
        currencyCode: 'CZK',
        transactionCount: 1,
      }),
      update: vi.fn(),
    };
    const service = new FinanceCatalogService(
      membershipAccess(),
      accounts as unknown as PrismaFinancialAccountRepository,
      {} as PrismaFinancialCategoryRepository,
    );
    await expect(
      service.updateAccount(userId, accountId, { currencyCode: 'EUR' }),
    ).rejects.toMatchObject({ code: 'FINANCE_INVALID_INPUT' });
    expect(accounts.update).not.toHaveBeenCalled();
  });

  it('separates currencies and filters reporting by the current household and period', async () => {
    const transactions = {
      listForReport: vi.fn().mockResolvedValue([
        {
          type: 'INCOME',
          amountMinor: 10_000n,
          currencyCode: 'CZK',
          category: null,
        },
        {
          type: 'EXPENSE',
          amountMinor: 2_500n,
          currencyCode: 'CZK',
          category: null,
        },
        {
          type: 'EXPENSE',
          amountMinor: 500n,
          currencyCode: 'EUR',
          category: { id: categoryId, name: 'Jídlo' },
        },
        {
          type: 'TRANSFER_OUT',
          amountMinor: 9_999n,
          currencyCode: 'CZK',
          category: null,
        },
      ]),
    };
    const accounts = {
      list: vi.fn().mockResolvedValue([
        {
          id: accountId,
          name: 'Běžný účet',
          currencyCode: 'CZK',
          currentBalanceMinor: '17500',
          archivedAt: null,
        },
        {
          id: '90000000-0000-4000-8000-000000000009',
          name: 'Euro účet',
          currencyCode: 'EUR',
          currentBalanceMinor: '500',
          archivedAt: null,
        },
      ]),
    };
    const clock: FinanceClockPort = {
      now: () => new Date('2026-07-16T10:00:00.000Z'),
    };
    const service = new FinanceReportingService(
      membershipAccess(),
      accounts as unknown as PrismaFinancialAccountRepository,
      transactions as unknown as PrismaFinancialTransactionRepository,
      clock,
    );
    const report = await service.summary(userId, {});
    expect(transactions.listForReport).toHaveBeenCalledWith(
      householdId,
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-07-31T00:00:00.000Z'),
    );
    expect(report.currencies).toEqual([
      expect.objectContaining({
        currencyCode: 'CZK',
        incomeMinor: '10000',
        expenseMinor: '2500',
        netMinor: '7500',
      }),
      expect.objectContaining({
        currencyCode: 'EUR',
        incomeMinor: '0',
        expenseMinor: '500',
        netMinor: '-500',
      }),
    ]);
  });

  it('derives a deterministic current-month period from the injected clock', () => {
    expect(
      resolveFinancePeriod({}, new Date('2026-02-15T12:00:00.000Z')),
    ).toEqual({
      from: new Date('2026-02-01T00:00:00.000Z'),
      to: new Date('2026-02-28T00:00:00.000Z'),
    });
  });

  it('rejects a reporting period whose start is after its end', () => {
    expect(() =>
      resolveFinancePeriod(
        { dateFrom: '2026-07-31', dateTo: '2026-07-01' },
        new Date('2026-07-15T12:00:00.000Z'),
      ),
    ).toThrow('Začátek období nesmí být po jeho konci.');
  });

  it.each([10, 20, 50, 100])('accepts pageSize %i', async (pageSize) => {
    const dto = plainToInstance(ListFinancialTransactionsDto, { pageSize });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects an unsupported page size', async () => {
    const dto = plainToInstance(ListFinancialTransactionsDto, { pageSize: 25 });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('preserves false document linkage filters and supports transfer listing', async () => {
    const dto = plainToInstance(ListFinancialTransactionsDto, {
      documentLinked: 'false',
      type: 'TRANSFER_OUT',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.documentLinked).toBe(false);
    expect(dto.type).toBe('TRANSFER_OUT');
  });
});
