import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../../audit/audit.service.js';
import {
  FinanceLedgerFacade,
  type ImportedLedgerRow,
} from '../../../finance/finance-ledger.facade.js';
import {
  financeImportConflict,
  financeImportNotFound,
} from '../../domain/finance-import.errors.js';
import {
  TEMPORARY_IMPORT_FILE_PORT,
  type TemporaryImportFilePort,
} from '../../domain/ports/temporary-import-file.port.js';
import { PrismaFinanceImportSessionRepository } from '../../infrastructure/prisma-finance-import-session.repository.js';
import type { CommitImportDto } from '../../presentation/dto/commit-import.dto.js';

@Injectable()
export class CommitImportSessionService {
  public constructor(
    private readonly sessions: PrismaFinanceImportSessionRepository,
    private readonly ledger: FinanceLedgerFacade,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(TEMPORARY_IMPORT_FILE_PORT)
    private readonly files: TemporaryImportFilePort,
  ) {}

  public async execute(
    userId: string,
    importId: string,
    input: CommitImportDto,
  ) {
    let session = await this.sessions.findById(importId);
    if (!session) throw financeImportNotFound();
    const account = await this.ledger.getAccount(
      userId,
      session.accountId,
      true,
    );
    if (account.householdId !== session.householdId)
      throw financeImportNotFound();
    if (session.status === 'COMPLETED') return completedResult(session);
    if (!['READY_FOR_REVIEW', 'COMMITTING'].includes(session.status))
      throw financeImportConflict('Import není připravený k potvrzení.');
    if (
      !input.confirmRepeatedFile &&
      (await this.sessions.findCompletedFile(
        session.householdId,
        session.accountId,
        session.fileChecksumSha256,
        importId,
      ))
    )
      throw financeImportConflict(
        'Stejný soubor již byl na tento účet importován.',
      );
    const rows = await this.sessions.rowsForCommit(importId);
    if (
      !input.confirmPossibleDuplicates &&
      rows.some((row) => row.status === 'POSSIBLE_DUPLICATE')
    )
      throw financeImportConflict('Potvrďte zahrnutí možných duplicit.');
    if (session.status === 'READY_FOR_REVIEW') {
      const claim = await this.sessions.claimCommit(importId);
      if (claim.count === 0)
        throw financeImportConflict('Import právě zpracovává jiný požadavek.');
      session = (await this.sessions.findById(importId)) ?? session;
    }
    const regular = rows
      .filter((row) => row.transactionType !== 'TRANSFER_IN')
      .map(toLedgerRow);
    let imported = await this.ledger.createImportedTransactions({
      userId,
      accountId: session.accountId,
      importSessionId: importId,
      rows: regular,
    });
    for (const row of rows.filter(
      (item) => item.transactionType === 'TRANSFER_IN',
    )) {
      if (
        !row.transferSourceAccountId ||
        !row.bookedDate ||
        !row.amountMinor ||
        !row.currencyCode ||
        !row.fingerprint
      )
        throw financeImportConflict(
          'Splátka kreditní karty není úplně zkontrolovaná.',
        );
      imported += await this.ledger.createImportedCardRepayment({
        userId,
        creditAccountId: session.accountId,
        importSessionId: importId,
        row: {
          importRowId: row.id,
          amountMinor: row.amountMinor,
          currencyCode: row.currencyCode,
          bookedDate: row.bookedDate,
          externalTransactionId: row.externalTransactionId,
          fingerprint: row.fingerprint,
          sourceAccountId: row.transferSourceAccountId,
          matchingTransactionId: row.matchingTransactionId,
        },
      });
    }
    if (session.temporaryStorageKey)
      await this.files.delete(session.temporaryStorageKey);
    const totalImported = await this.prisma.financialTransaction.count({
      where: { importSessionId: importId },
    });
    await this.sessions.markCompleted(importId, totalImported);
    await this.prisma.$transaction((transaction) =>
      this.audit.record(transaction, {
        action: 'FINANCE_IMPORT_COMMITTED',
        householdId: session.householdId,
        userId,
        entityType: 'FinanceImportSession',
        entityId: importId,
        metadata: {
          importId,
          accountId: session.accountId,
          importedRowCount: totalImported,
        },
      }),
    );
    return {
      importId,
      status: 'COMPLETED',
      importedRowCount: totalImported,
      createdNow: imported,
    };
  }
}

function toLedgerRow(
  row: Awaited<
    ReturnType<PrismaFinanceImportSessionRepository['rowsForCommit']>
  >[number],
): ImportedLedgerRow {
  if (
    !row.bookedDate ||
    !row.amountMinor ||
    !row.currencyCode ||
    !row.fingerprint ||
    !row.transactionType ||
    row.transactionType === 'TRANSFER_IN' ||
    row.transactionType === 'TRANSFER_OUT' ||
    row.transactionType === 'ADJUSTMENT'
  )
    throw financeImportConflict(
      `Řádek ${String(row.rowNumber)} nemá platná normalizovaná data.`,
    );
  return {
    importRowId: row.id,
    type: row.transactionType,
    amountMinor: row.amountMinor,
    currencyCode: row.currencyCode,
    bookedDate: row.bookedDate,
    transactionDate: row.transactionDate,
    externalTransactionId: row.externalTransactionId,
    fingerprint: row.fingerprint,
    merchantNormalizedName: row.merchantNormalizedName,
    categoryId: row.categoryId,
    counterpartyName: row.counterpartyName,
    counterpartyAccount: row.counterpartyAccount,
    description: row.description,
    variableSymbol: row.variableSymbol,
    constantSymbol: row.constantSymbol,
    specificSymbol: row.specificSymbol,
  };
}

function completedResult(session: {
  id: string;
  status: string;
  importedRowCount: number;
}) {
  return {
    importId: session.id,
    status: session.status,
    importedRowCount: session.importedRowCount,
    createdNow: 0,
  };
}
