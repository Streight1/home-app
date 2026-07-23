import { Injectable } from '@nestjs/common';
import { FinanceCategorizationFacade } from '../../../finance-categorization/finance-categorization.facade.js';
import { FinanceLedgerFacade } from '../../../finance/finance-ledger.facade.js';
import type {
  CsvFormatSettings,
  ImportMappingSettings,
  NormalizedImportRow,
} from '../../domain/finance-import.types.js';
import { NormalizeImportRowService } from '../parsing/normalize-import-row.service.js';
import type { WritableImportSession } from './finance-import-configuration.js';

@Injectable()
export class PrepareImportRowsService {
  public constructor(
    private readonly normalizer: NormalizeImportRowService,
    private readonly categorization: FinanceCategorizationFacade,
    private readonly ledger: FinanceLedgerFacade,
  ) {}

  public async prepare(input: {
    userId: string;
    session: WritableImportSession;
    table: readonly ReadonlyMap<string, string>[];
    format: CsvFormatSettings;
    mapping: ImportMappingSettings;
  }): Promise<NormalizedImportRow[]> {
    const rows = input.table.map((values, index) =>
      this.normalizer.normalize({
        accountId: input.session.accountId,
        accountType: input.session.account.type,
        accountCurrency: input.session.account.currencyCode,
        rowNumber: index + 1,
        values,
        format: input.format,
        mapping: input.mapping,
      }),
    );
    const categories = await this.categorization.categorize(
      input.userId,
      rows.map((row) => ({
        accountId: input.session.accountId,
        transactionType: row.transactionType,
        counterpartyName: row.counterpartyName,
        counterpartyAccount: row.counterpartyAccount,
        description: row.description,
        variableSymbol: row.variableSymbol,
      })),
    );
    rows.forEach((row, index) => {
      row.categoryId = categories[index] ?? null;
    });
    await this.markDuplicates(input.userId, input.session.accountId, rows);
    return rows;
  }

  private async markDuplicates(
    userId: string,
    accountId: string,
    rows: NormalizedImportRow[],
  ): Promise<void> {
    const externalIds = rows.flatMap((row) =>
      row.externalTransactionId ? [row.externalTransactionId] : [],
    );
    const fingerprints = rows.flatMap((row) =>
      row.fingerprint ? [row.fingerprint] : [],
    );
    const duplicates = await this.ledger.findDuplicateCandidates(
      userId,
      accountId,
      externalIds,
      fingerprints,
    );
    const seen = new Set<string>();
    for (const row of rows) {
      const externalKey = row.externalTransactionId
        ? `external:${row.externalTransactionId}`
        : null;
      const fingerprintKey = row.fingerprint
        ? `fingerprint:${row.fingerprint}`
        : null;
      const duplicate =
        (externalKey ? duplicates.get(externalKey) : undefined) ??
        (fingerprintKey ? duplicates.get(fingerprintKey) : undefined);
      const repeatedInsideFile = [externalKey, fingerprintKey].some(
        (key) => key !== null && seen.has(key),
      );
      for (const key of [externalKey, fingerprintKey]) if (key) seen.add(key);
      if (row.status === 'VALID' && (duplicate || repeatedInsideFile)) {
        row.status = 'POSSIBLE_DUPLICATE';
        row.userIncluded = false;
        row.duplicateTransactionId = duplicate?.id ?? null;
      }
    }
  }
}
