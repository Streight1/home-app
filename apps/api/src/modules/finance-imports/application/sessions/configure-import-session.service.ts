import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../config/app-config.service.js';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../../audit/audit.service.js';
import { FinanceLedgerFacade } from '../../../finance/finance-ledger.facade.js';
import type { ImportMappingSettings } from '../../domain/finance-import.types.js';
import {
  financeImportConflict,
  financeImportInvalid,
  financeImportNotFound,
} from '../../domain/finance-import.errors.js';
import {
  TEMPORARY_IMPORT_FILE_PORT,
  type TemporaryImportFilePort,
} from '../../domain/ports/temporary-import-file.port.js';
import { PrismaFinanceImportProfileRepository } from '../../infrastructure/prisma-finance-import-profile.repository.js';
import { PrismaFinanceImportSessionRepository } from '../../infrastructure/prisma-finance-import-session.repository.js';
import type { ConfigureImportFormatDto } from '../../presentation/dto/configure-import-format.dto.js';
import type { ConfigureImportMappingDto } from '../../presentation/dto/configure-import-mapping.dto.js';
import { decodeCsv, parseCsvRecords } from '../parsing/csv-parser.js';
import {
  buildImportTable,
  requireImportFormat,
  summarizeImportRows,
  validateImportMapping,
} from './finance-import-configuration.js';
import { PrepareImportRowsService } from './prepare-import-rows.service.js';

@Injectable()
export class ConfigureImportSessionService {
  public constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ledger: FinanceLedgerFacade,
    private readonly sessions: PrismaFinanceImportSessionRepository,
    private readonly profiles: PrismaFinanceImportProfileRepository,
    private readonly rowPreparation: PrepareImportRowsService,
    @Inject(TEMPORARY_IMPORT_FILE_PORT)
    private readonly files: TemporaryImportFilePort,
  ) {}

  public async format(
    userId: string,
    importId: string,
    input: ConfigureImportFormatDto,
  ) {
    const session = await this.requireWritable(userId, importId);
    if (input.thousandSeparator === input.decimalSeparator)
      throw financeImportInvalid(
        'Oddělovač desetinných míst a tisíců musí být odlišný.',
      );
    if (!session.temporaryStorageKey)
      throw financeImportConflict('Importní soubor již není dostupný.');
    const buffer = await this.files.read(
      session.temporaryStorageKey,
      this.config.financeImportMaxFileBytes,
    );
    const records = parseCsvRecords(
      decodeCsv(buffer, input.encoding),
      input.delimiter,
      input.quoteCharacter,
      this.config.financeImportMaxRows,
    );
    await this.sessions.updateFormat(importId, input);
    return {
      importId,
      format: input,
      sample: buildImportTable(records, input)
        .slice(0, 8)
        .map((row) => Object.fromEntries(row)),
    };
  }

  public async mapping(
    userId: string,
    importId: string,
    input: ConfigureImportMappingDto,
  ) {
    const session = await this.requireWritable(userId, importId);
    if (!session.temporaryStorageKey)
      throw financeImportConflict('Importní soubor již není dostupný.');
    const format = requireImportFormat(session);
    validateImportMapping(input.columnMapping, input.amountColumnMode);
    const buffer = await this.files.read(
      session.temporaryStorageKey,
      this.config.financeImportMaxFileBytes,
    );
    const records = parseCsvRecords(
      decodeCsv(buffer, format.encoding),
      format.delimiter,
      format.quoteCharacter,
      this.config.financeImportMaxRows,
    );
    const table = buildImportTable(records, format);
    if (table.length > this.config.financeImportMaxRows)
      throw financeImportInvalid('CSV obsahuje příliš mnoho řádků.');
    const mapping: ImportMappingSettings = {
      amountColumnMode: input.amountColumnMode,
      columnMapping: input.columnMapping,
      invertAmountSign: input.invertAmountSign,
      defaultCurrencyCode: input.defaultCurrencyCode ?? null,
    };
    const rows = await this.rowPreparation.prepare({
      userId,
      session,
      table,
      format,
      mapping,
    });
    let profileId = input.profileId ?? null;
    if (
      profileId &&
      !(await this.profiles.find(session.householdId, profileId))
    )
      throw financeImportNotFound();
    if (input.saveProfileName) {
      const profile = await this.profiles.create(session.householdId, userId, {
        name: input.saveProfileName,
        accountId: session.accountId,
        sourceKind: session.sourceKind,
        ...format,
        amountColumnMode: input.amountColumnMode,
        columnMapping: input.columnMapping,
        invertAmountSign: input.invertAmountSign,
        defaultCurrencyCode: input.defaultCurrencyCode ?? null,
      });
      profileId = profile.id;
    }
    await this.sessions.replaceRows({
      sessionId: importId,
      profileId,
      mapping,
      rows,
    });
    await this.prisma.$transaction((transaction) =>
      this.audit.record(transaction, {
        action: 'FINANCE_IMPORT_CONFIGURED',
        householdId: session.householdId,
        userId,
        entityType: 'FinanceImportSession',
        entityId: importId,
        metadata: {
          importId,
          accountId: session.accountId,
          profileId,
          rowCount: rows.length,
        },
      }),
    );
    return {
      importId,
      status: 'READY_FOR_REVIEW',
      counts: summarizeImportRows(rows),
      profileId,
    };
  }

  private async requireWritable(userId: string, importId: string) {
    const session = await this.sessions.findById(importId);
    if (!session) throw financeImportNotFound();
    const account = await this.ledger.getAccount(
      userId,
      session.accountId,
      true,
    );
    if (account.householdId !== session.householdId)
      throw financeImportNotFound();
    if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(session.status))
      throw financeImportConflict('Dokončený import nelze měnit.');
    return session;
  }
}
