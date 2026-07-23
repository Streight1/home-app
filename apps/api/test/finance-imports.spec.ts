import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import type { StoragePort } from '../src/infrastructure/storage/storage.port.js';
import type { AuditService } from '../src/modules/audit/audit.service.js';
import { FinanceCategorizationFacade } from '../src/modules/finance-categorization/finance-categorization.facade.js';
import { matchCategorizationRule } from '../src/modules/finance-categorization/domain/categorization-rule.matcher.js';
import { normalizeMerchantName } from '../src/modules/finance-categorization/domain/merchant-normalizer.js';
import { CalculateTransactionFingerprintService } from '../src/modules/finance-imports/application/deduplication/calculate-transaction-fingerprint.service.js';
import {
  decodeCsv,
  parseCsvRecords,
} from '../src/modules/finance-imports/application/parsing/csv-parser.js';
import { DetectCsvFormatService } from '../src/modules/finance-imports/application/parsing/detect-csv-format.service.js';
import {
  NormalizeImportRowService,
  parseDate,
  parseMoney,
} from '../src/modules/finance-imports/application/parsing/normalize-import-row.service.js';
import { StorageTemporaryImportFileAdapter } from '../src/modules/finance-imports/infrastructure/storage-temporary-import-file.adapter.js';
import { CleanupExpiredImportsService } from '../src/modules/finance-imports/application/cleanup/cleanup-expired-imports.service.js';
import { CommitImportSessionService } from '../src/modules/finance-imports/application/sessions/commit-import-session.service.js';
import type { TemporaryImportFilePort } from '../src/modules/finance-imports/domain/ports/temporary-import-file.port.js';
import type { PrismaFinanceImportSessionRepository } from '../src/modules/finance-imports/infrastructure/prisma-finance-import-session.repository.js';
import type { FinanceLedgerFacade } from '../src/modules/finance/finance-ledger.facade.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';

const format = {
  encoding: 'utf-8' as const,
  delimiter: ';' as const,
  quoteCharacter: '"' as const,
  hasHeader: true,
  headerRowNumber: 1,
  skipRowsBefore: 0,
  dateFormat: 'DD.MM.YYYY' as const,
  decimalSeparator: ',' as const,
  thousandSeparator: ' ' as const,
};

describe('finance import parsing and normalization', () => {
  it('loads UTF-8 with BOM and detects a semicolon', () => {
    const input = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from('Datum;Částka\n16.07.2026;-1 250,50'),
    ]);
    const detected = new DetectCsvFormatService().detect(input);
    expect(detected).toMatchObject({
      encoding: 'utf-8',
      delimiter: ';',
      hasHeader: true,
    });
    expect(decodeCsv(input, 'utf-8')).not.toContain('\uFEFF');
  });

  it('supports an explicit Windows-1250 decoder', () => {
    expect(
      decodeCsv(
        Buffer.from([0x50, 0xf8, 0xed, 0x6a, 0x65, 0x6d]),
        'windows-1250',
      ),
    ).toBe('Příjem');
  });

  it('parses quoted CSV safely and rejects NUL binary content', () => {
    expect(parseCsvRecords('a;"b;c"\n1;2', ';', '"', 10)).toEqual([
      ['a', 'b;c'],
      ['1', '2'],
    ]);
    expect(() => parseCsvRecords('a\0b', ';', '"', 10)).toThrow();
  });

  it('enforces the configured row limit before an unbounded preview can form', () => {
    expect(() => parseCsvRecords('a\n1\n2', ';', '"', 2)).toThrow(/řádků/i);
  });

  it('converts decimal comma to exact minor units without float', () => {
    expect(parseMoney('38 990,75', format)).toBe(3_899_075n);
    expect(parseMoney('1e3', format)).toBeNull();
  });

  it.each([
    ['2026-07-16', 'YYYY-MM-DD' as const],
    ['16.07.2026', 'DD.MM.YYYY' as const],
    ['16/07/2026', 'DD/MM/YYYY' as const],
  ])('normalizes date %s', (input, dateFormat) => {
    expect(parseDate(input, dateFormat)?.toISOString().slice(0, 10)).toBe(
      '2026-07-16',
    );
  });

  it('normalizes separate debit and credit columns and invert sign', () => {
    const service = new NormalizeImportRowService(
      new CalculateTransactionFingerprintService(),
    );
    const row = service.normalize({
      accountId: '30000000-0000-4000-8000-000000000003',
      accountType: 'CURRENT',
      accountCurrency: 'CZK',
      rowNumber: 1,
      values: new Map([
        ['Datum', '16.07.2026'],
        ['Výdaj', '1 250,00'],
        ['Příjem', ''],
        ['Obchodník', 'POS   ALFA s.r.o.'],
      ]),
      format,
      mapping: {
        amountColumnMode: 'SEPARATE_DEBIT_CREDIT',
        columnMapping: {
          bookedDate: 'Datum',
          debitAmount: 'Výdaj',
          creditAmount: 'Příjem',
          counterpartyName: 'Obchodník',
        },
        invertAmountSign: false,
        defaultCurrencyCode: 'CZK',
      },
    });
    expect(row).toMatchObject({
      status: 'VALID',
      transactionType: 'EXPENSE',
      amountMinor: 125_000n,
      merchantNormalizedName: 'alfa s.r.o.',
    });
    expect(row.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('marks a positive credit-card movement for transfer/refund review', () => {
    const service = new NormalizeImportRowService(
      new CalculateTransactionFingerprintService(),
    );
    const row = service.normalize({
      accountId: '30000000-0000-4000-8000-000000000003',
      accountType: 'CREDIT_CARD',
      accountCurrency: 'CZK',
      rowNumber: 1,
      values: new Map([
        ['Datum', '16.07.2026'],
        ['Částka', '500,00'],
      ]),
      format,
      mapping: {
        amountColumnMode: 'SIGNED_AMOUNT',
        columnMapping: { bookedDate: 'Datum', signedAmount: 'Částka' },
        invertAmountSign: false,
        defaultCurrencyCode: 'CZK',
      },
    });
    expect(row).toMatchObject({
      status: 'NEEDS_TRANSFER_REVIEW',
      transactionType: 'REFUND',
      userIncluded: false,
    });
  });

  it('creates deterministic fingerprints', () => {
    const service = new CalculateTransactionFingerprintService();
    const candidate = {
      accountId: 'a',
      bookedDate: '2026-07-16',
      transactionDate: null,
      amountMinor: 100n,
      currencyCode: 'CZK',
      counterpartyName: ' Obchod ',
      counterpartyAccount: null,
      variableSymbol: null,
      description: null,
    };
    expect(service.calculate(candidate)).toBe(service.calculate(candidate));
  });
});

describe('categorization and temporary storage boundaries', () => {
  it('normalizes merchant noise while preserving a useful name', () => {
    expect(normalizeMerchantName('  PLATBA KARTOU   ALZA.CZ  ')).toBe(
      'alza.cz',
    );
  });

  it('uses the first priority-sorted matching rule and skips disabled rules before this pure matcher', () => {
    const rules = [
      {
        categoryId: 'high',
        accountId: null,
        transactionType: 'EXPENSE',
        field: 'COUNTERPARTY_NAME' as const,
        operator: 'CONTAINS' as const,
        normalizedComparisonValue: 'alza',
      },
      {
        categoryId: 'low',
        accountId: null,
        transactionType: null,
        field: 'COUNTERPARTY_NAME' as const,
        operator: 'CONTAINS' as const,
        normalizedComparisonValue: 'alza',
      },
    ];
    expect(
      matchCategorizationRule(
        {
          accountId: 'account',
          transactionType: 'EXPENSE',
          counterpartyName: 'ALZA.cz',
          counterpartyAccount: null,
          description: null,
          variableSymbol: null,
        },
        rules,
      ),
    ).toBe('high');
  });

  it('matches a counterparty account only on the scoped financial account', () => {
    expect(
      matchCategorizationRule(
        {
          accountId: 'current-account',
          transactionType: 'EXPENSE',
          counterpartyName: null,
          counterpartyAccount: '19-123456789/0100',
          description: null,
          variableSymbol: null,
        },
        [
          {
            categoryId: 'rent',
            accountId: 'current-account',
            transactionType: 'EXPENSE',
            field: 'COUNTERPARTY_ACCOUNT',
            operator: 'EQUALS',
            normalizedComparisonValue: '19-123456789/0100',
          },
        ],
      ),
    ).toBe('rent');
  });

  it('does not apply a rule scoped to another account', () => {
    expect(
      matchCategorizationRule(
        {
          accountId: 'savings-account',
          transactionType: 'EXPENSE',
          counterpartyName: 'ALZA',
          counterpartyAccount: null,
          description: null,
          variableSymbol: null,
        },
        [
          {
            categoryId: 'electronics',
            accountId: 'current-account',
            transactionType: 'EXPENSE',
            field: 'COUNTERPARTY_NAME',
            operator: 'CONTAINS',
            normalizedComparisonValue: 'alza',
          },
        ],
      ),
    ).toBeNull();
  });

  it('loads only enabled categorization rules in deterministic priority order', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      financialCategorizationRule: { findMany },
    } as unknown as PrismaService;
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household' }),
    } as unknown as HouseholdAccessService;
    const facade = new FinanceCategorizationFacade(prisma, access);
    await facade.categorize('user', []);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { householdId: 'household', enabled: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('uses only server-generated temporary storage paths', async () => {
    const storage = {
      write: vi.fn().mockResolvedValue({
        storageKey: 'finance-imports/temporary/h/s/random',
      }),
      getMetadata: vi.fn(),
      read: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
    } as unknown as StoragePort;
    const adapter = new StorageTemporaryImportFileAdapter(storage);
    await adapter.write(
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002',
      Buffer.from('csv'),
    );
    expect(storage.write).toHaveBeenCalledWith(expect.any(Buffer), {
      directorySegments: [
        'finance-imports',
        'temporary',
        '10000000-0000-4000-8000-000000000001',
        '20000000-0000-4000-8000-000000000002',
      ],
    });
    expect(JSON.stringify(vi.mocked(storage.write).mock.calls)).not.toContain(
      '.csv',
    );
  });

  it('retries failed expiration cleanup without losing the temporary key', async () => {
    const sessions = {
      expired: vi
        .fn()
        .mockResolvedValue([
          { id: 'import', temporaryStorageKey: 'private-key' },
        ]),
      expire: vi.fn(),
    } as unknown as PrismaFinanceImportSessionRepository;
    const files = {
      delete: vi
        .fn()
        .mockRejectedValueOnce(new Error('storage unavailable'))
        .mockResolvedValueOnce(undefined),
    } as unknown as TemporaryImportFilePort;
    const cleanup = new CleanupExpiredImportsService(sessions, files);
    expect(await cleanup.execute(new Date('2026-07-16'))).toEqual({
      expiredCount: 0,
    });
    expect(sessions.expire).not.toHaveBeenCalled();
    expect(await cleanup.execute(new Date('2026-07-16'))).toEqual({
      expiredCount: 1,
    });
    expect(sessions.expire).toHaveBeenCalledWith('import');
  });

  it('returns an already completed commit without creating duplicate transactions', async () => {
    const session = {
      id: 'import',
      status: 'COMPLETED',
      importedRowCount: 12,
      accountId: 'account',
      householdId: 'household',
    };
    const sessions = {
      findById: vi.fn().mockResolvedValue(session),
    } as unknown as PrismaFinanceImportSessionRepository;
    const ledger = {
      getAccount: vi.fn().mockResolvedValue({ householdId: 'household' }),
      createImportedTransactions: vi.fn(),
    } as unknown as FinanceLedgerFacade;
    const service = new CommitImportSessionService(
      sessions,
      ledger,
      {} as PrismaService,
      {} as AuditService,
      {} as TemporaryImportFilePort,
    );
    await expect(
      service.execute('user', 'import', {
        confirmPossibleDuplicates: false,
        confirmRepeatedFile: false,
      }),
    ).resolves.toEqual({
      importId: 'import',
      status: 'COMPLETED',
      importedRowCount: 12,
      createdNow: 0,
    });
    expect(ledger.createImportedTransactions).not.toHaveBeenCalled();
  });
});
