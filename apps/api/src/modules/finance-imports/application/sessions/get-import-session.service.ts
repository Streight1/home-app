import { Injectable } from '@nestjs/common';
import { FinanceLedgerFacade } from '../../../finance/finance-ledger.facade.js';
import { financeImportNotFound } from '../../domain/finance-import.errors.js';
import { PrismaFinanceImportSessionRepository } from '../../infrastructure/prisma-finance-import-session.repository.js';
import type { ImportPreviewQueryDto } from '../../presentation/dto/import-preview.dto.js';
import type { UpdateImportRowDto } from '../../presentation/dto/update-import-row.dto.js';

@Injectable()
export class GetImportSessionService {
  public constructor(
    private readonly sessions: PrismaFinanceImportSessionRepository,
    private readonly ledger: FinanceLedgerFacade,
  ) {}

  public async detail(userId: string, importId: string) {
    const session = await this.scoped(userId, importId, false);
    return mapSession(session);
  }

  public async preview(
    userId: string,
    importId: string,
    query: ImportPreviewQueryDto,
  ) {
    const session = await this.scoped(userId, importId, false);
    return {
      session: mapSession(session),
      ...(await this.sessions.preview(importId, query)),
    };
  }

  public async updateRow(
    userId: string,
    importId: string,
    rowId: string,
    input: UpdateImportRowDto,
  ) {
    await this.scoped(userId, importId, true);
    const row = await this.sessions.findRow(importId, rowId);
    if (!row) throw financeImportNotFound();
    const transactionType = input.transactionType ?? row.transactionType;
    if (
      input.categoryId &&
      transactionType &&
      transactionType !== 'TRANSFER_IN' &&
      transactionType !== 'TRANSFER_OUT' &&
      transactionType !== 'ADJUSTMENT'
    )
      await this.ledger.verifyCategory(
        userId,
        input.categoryId,
        transactionType,
      );
    if (input.transferSourceAccountId)
      await this.ledger.getAccount(userId, input.transferSourceAccountId, true);
    if (!(await this.sessions.updateRow(importId, rowId, input)))
      throw financeImportNotFound();
    return { id: rowId };
  }

  public async bulkCategory(
    userId: string,
    importId: string,
    rowIds: readonly string[],
    categoryId: string,
  ) {
    await this.scoped(userId, importId, true);
    await this.ledger.verifyCategory(userId, categoryId, 'EXPENSE');
    return {
      updatedCount: await this.sessions.bulkCategory(
        importId,
        rowIds,
        categoryId,
      ),
    };
  }

  public async list(userId: string, page: number, pageSize: number) {
    const account = await this.ledger.getAccountForCurrentHousehold(
      userId,
      false,
    );
    const result = await this.sessions.listHistory(
      account.householdId,
      page,
      pageSize,
    );
    return { ...result, items: result.items.map(mapSession) };
  }

  private async scoped(userId: string, importId: string, writable: boolean) {
    const session = await this.sessions.findById(importId);
    if (!session) throw financeImportNotFound();
    const account = await this.ledger.getAccount(
      userId,
      session.accountId,
      writable,
    );
    if (account.householdId !== session.householdId)
      throw financeImportNotFound();
    return session;
  }
}

function mapSession(
  session: Awaited<
    ReturnType<PrismaFinanceImportSessionRepository['findById']>
  > extends infer Value
    ? NonNullable<Value>
    : never,
) {
  return {
    id: session.id,
    account: session.account,
    profile: session.profile,
    sourceKind: session.sourceKind,
    status: session.status,
    originalFilename: session.originalFilename,
    fileSizeBytes: session.fileSizeBytes.toString(),
    detectedFormat: {
      encoding: session.detectedEncoding,
      delimiter: session.detectedDelimiter,
      headerRow: session.detectedHeaderRow,
    },
    configuredFormat: session.encoding
      ? {
          encoding: session.encoding,
          delimiter: session.delimiter,
          hasHeader: session.hasHeader,
          headerRowNumber: session.headerRowNumber,
          skipRowsBefore: session.skipRowsBefore,
          dateFormat: session.dateFormat,
          decimalSeparator: session.decimalSeparator,
          thousandSeparator: session.thousandSeparator,
        }
      : null,
    counts: {
      total: session.totalRowCount,
      valid: session.validRowCount,
      invalid: session.invalidRowCount,
      possibleDuplicates: session.duplicateRowCount,
      ignored: session.ignoredRowCount,
      imported: session.importedRowCount,
    },
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    expiresAt: session.expiresAt,
    committedAt: session.committedAt,
    cancelledAt: session.cancelledAt,
  };
}
