import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ApiException } from '../src/common/errors/api-exception.js';
import { FinanceTransferService } from '../src/modules/finance/application/finance-transfer.service.js';
import {
  calculateAccountBalance,
  isCategoryKindAllowed,
  validateTransferAccounts,
} from '../src/modules/finance/domain/ledger-rules.js';
import {
  parseCzechMoneyInput,
  parseMinorUnits,
} from '../src/modules/finance/domain/money.js';
import type { PrismaFinancialAccountRepository } from '../src/modules/finance/infrastructure/prisma-financial-account.repository.js';
import type { PrismaFinancialTransferRepository } from '../src/modules/finance/infrastructure/prisma-financial-transfer.repository.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';

const householdId = '10000000-0000-4000-8000-000000000001';
const userId = '20000000-0000-4000-8000-000000000002';
const fromId = '30000000-0000-4000-8000-000000000003';
const toId = '40000000-0000-4000-8000-000000000004';

const account = (
  id: string,
  currencyCode = 'CZK',
  archivedAt: Date | null = null,
) => ({
  id,
  currencyCode,
  archivedAt,
});

describe('finance money and ledger rules', () => {
  it.each([
    ['100,00', 10_000n],
    ['38 990,00', 3_899_000n],
    ['12.5', 1_250n],
    ['0,01', 1n],
    ['-15,25', -1_525n],
  ])('parses Czech money %s exactly', (input, expected) => {
    expect(parseCzechMoneyInput(input)).toBe(expected);
  });

  it.each(['1,234', '1.234', 'abc', '', '1e3'])(
    'rejects unsafe money input %s',
    (input) => {
      expect(() => parseCzechMoneyInput(input)).toThrow();
    },
  );

  it('serializes arbitrarily large minor units without Number conversion', () => {
    expect(parseMinorUnits('900719925474099300').toString()).toBe(
      '900719925474099300',
    );
  });

  it('requires a positive ledger amount', () => {
    expect(() => parseMinorUnits('0')).toThrow();
    expect(() => parseMinorUnits('-1')).toThrow();
  });

  it('permits a negative opening balance explicitly', () => {
    expect(
      parseMinorUnits('-5000', { allowNegative: true, allowZero: true }),
    ).toBe(-5_000n);
  });

  it('derives account balance from every non-deleted ledger direction', () => {
    expect(
      calculateAccountBalance(10_000n, [
        { type: 'INCOME', amountMinor: 2_000n },
        { type: 'EXPENSE', amountMinor: 500n },
        { type: 'TRANSFER_IN', amountMinor: 3_000n },
        { type: 'TRANSFER_OUT', amountMinor: 1_000n },
        { type: 'ADJUSTMENT', amountMinor: 200n },
      ]),
    ).toBe(13_700n);
  });

  it('does not count a transfer as an expense category', () => {
    const reportTypes = ['EXPENSE', 'INCOME'];
    expect(reportTypes).not.toContain('TRANSFER_OUT');
    expect(reportTypes).not.toContain('TRANSFER_IN');
  });

  it.each([
    ['EXPENSE', 'EXPENSE', true],
    ['INCOME', 'INCOME', true],
    ['BOTH', 'EXPENSE', true],
    ['BOTH', 'INCOME', true],
    ['EXPENSE', 'INCOME', false],
    ['INCOME', 'EXPENSE', false],
  ] as const)('validates category %s for %s', (kind, type, expected) => {
    expect(isCategoryKindAllowed(kind, type)).toBe(expected);
  });

  it('allows only same-currency transfers between distinct active accounts', () => {
    expect(validateTransferAccounts(account(fromId), account(toId))).toBe(
      'CZK',
    );
  });

  it('rejects a transfer to the same account', () => {
    expect(() =>
      validateTransferAccounts(account(fromId), account(fromId)),
    ).toThrow();
  });

  it('rejects a cross-currency transfer', () => {
    expect(() =>
      validateTransferAccounts(account(fromId), account(toId, 'EUR')),
    ).toThrow();
  });

  it('rejects an archived transfer account', () => {
    expect(() =>
      validateTransferAccounts(
        account(fromId, 'CZK', new Date()),
        account(toId),
      ),
    ).toThrow();
  });
});

describe('finance transfer application policy', () => {
  function service(role: 'MEMBER' | 'VIEWER' = 'MEMBER') {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockImplementation((_userId, minimumRole) => {
          if (role === 'VIEWER' && minimumRole === 'MEMBER') {
            throw new ApiException(
              HttpStatus.FORBIDDEN,
              'HOUSEHOLD_ACCESS_DENIED',
              'Zakázáno.',
            );
          }
          return Promise.resolve({ householdId, role });
        }),
    } as unknown as HouseholdAccessService;
    const accounts = {
      findRecord: vi
        .fn()
        .mockImplementation((_householdId, id) =>
          Promise.resolve(id === fromId ? account(fromId) : account(toId)),
        ),
    } as unknown as PrismaFinancialAccountRepository;
    const transfers = {
      create: vi.fn().mockResolvedValue('50000000-0000-4000-8000-000000000005'),
      update: vi.fn().mockResolvedValue(true),
      softDelete: vi.fn().mockResolvedValue(true),
    } as unknown as PrismaFinancialTransferRepository;
    return {
      service: new FinanceTransferService(access, accounts, transfers),
      transfers,
    };
  }

  const input = {
    fromAccountId: fromId,
    toAccountId: toId,
    amountMinor: '12500',
    bookedDate: '2026-07-16',
    note: null,
  };

  it('lets a member create one atomic transfer command', async () => {
    const context = service();
    await context.service.create(userId, input);
    expect(context.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        currencyCode: 'CZK',
        data: input,
      }),
    );
  });

  it('prevents a viewer from creating a transfer', async () => {
    const context = service('VIEWER');
    await expect(context.service.create(userId, input)).rejects.toMatchObject({
      code: 'HOUSEHOLD_ACCESS_DENIED',
    });
    expect(context.transfers.create).not.toHaveBeenCalled();
  });

  it('updates both sides through the transfer repository boundary', async () => {
    const context = service();
    await context.service.update(
      userId,
      '50000000-0000-4000-8000-000000000005',
      input,
    );
    expect(context.transfers.update).toHaveBeenCalledOnce();
  });

  it('deletes a transfer only through the paired transfer workflow', async () => {
    const context = service();
    await context.service.delete(
      userId,
      '50000000-0000-4000-8000-000000000005',
    );
    expect(context.transfers.softDelete).toHaveBeenCalledOnce();
  });
});
