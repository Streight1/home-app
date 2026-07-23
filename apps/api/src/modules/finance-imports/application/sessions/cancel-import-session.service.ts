import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../../audit/audit.service.js';
import { FinanceLedgerFacade } from '../../../finance/finance-ledger.facade.js';
import {
  financeImportConflict,
  financeImportNotFound,
} from '../../domain/finance-import.errors.js';
import {
  TEMPORARY_IMPORT_FILE_PORT,
  type TemporaryImportFilePort,
} from '../../domain/ports/temporary-import-file.port.js';
import { PrismaFinanceImportSessionRepository } from '../../infrastructure/prisma-finance-import-session.repository.js';

@Injectable()
export class CancelImportSessionService {
  public constructor(
    private readonly sessions: PrismaFinanceImportSessionRepository,
    private readonly ledger: FinanceLedgerFacade,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(TEMPORARY_IMPORT_FILE_PORT)
    private readonly files: TemporaryImportFilePort,
  ) {}

  public async execute(userId: string, importId: string): Promise<void> {
    const session = await this.sessions.findById(importId);
    if (!session) throw financeImportNotFound();
    const account = await this.ledger.getAccount(
      userId,
      session.accountId,
      true,
    );
    if (account.householdId !== session.householdId)
      throw financeImportNotFound();
    if (session.status === 'CANCELLED') return;
    if (['COMPLETED', 'COMMITTING', 'EXPIRED'].includes(session.status))
      throw financeImportConflict('Tento import už nelze zrušit.');
    if (session.temporaryStorageKey)
      await this.files.delete(session.temporaryStorageKey);
    await this.sessions.markCancelled(importId);
    await this.prisma.$transaction((transaction) =>
      this.audit.record(transaction, {
        action: 'FINANCE_IMPORT_CANCELLED',
        householdId: session.householdId,
        userId,
        entityType: 'FinanceImportSession',
        entityId: importId,
        metadata: { importId, accountId: session.accountId },
      }),
    );
  }
}
