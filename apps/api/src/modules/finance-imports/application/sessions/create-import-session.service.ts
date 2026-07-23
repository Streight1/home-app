import { createHash, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../config/app-config.service.js';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../../audit/audit.service.js';
import { FinanceLedgerFacade } from '../../../finance/finance-ledger.facade.js';
import { financeImportInvalid } from '../../domain/finance-import.errors.js';
import {
  TEMPORARY_IMPORT_FILE_PORT,
  type TemporaryImportFilePort,
} from '../../domain/ports/temporary-import-file.port.js';
import { PrismaFinanceImportSessionRepository } from '../../infrastructure/prisma-finance-import-session.repository.js';
import type { CreateImportSessionDto } from '../../presentation/dto/create-import-session.dto.js';
import { DetectCsvFormatService } from '../parsing/detect-csv-format.service.js';

@Injectable()
export class CreateImportSessionService {
  public constructor(
    private readonly config: AppConfigService,
    private readonly ledger: FinanceLedgerFacade,
    private readonly sessions: PrismaFinanceImportSessionRepository,
    private readonly detectFormat: DetectCsvFormatService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(TEMPORARY_IMPORT_FILE_PORT)
    private readonly files: TemporaryImportFilePort,
  ) {}

  public async execute(
    userId: string,
    input: CreateImportSessionDto,
    file: Express.Multer.File | undefined,
  ) {
    const account = await this.ledger.getAccount(userId, input.accountId, true);
    validateFile(file, this.config.financeImportMaxFileBytes);
    if (input.sourceKind === 'CREDIT_CARD' && account.type !== 'CREDIT_CARD')
      throw financeImportInvalid(
        'Import kreditní karty vyžaduje kreditní účet.',
      );
    if (input.sourceKind === 'BANK_ACCOUNT' && account.type === 'CREDIT_CARD')
      throw financeImportInvalid(
        'Pro kreditní účet zvolte import kreditní karty.',
      );
    const id = randomUUID();
    const detection = this.detectFormat.detect(file.buffer);
    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const storageKey = await this.files.write(
      account.householdId,
      id,
      file.buffer,
    );
    try {
      const session = await this.sessions.create({
        id,
        householdId: account.householdId,
        accountId: account.id,
        userId,
        sourceKind: input.sourceKind,
        originalFilename: sanitizeFilename(file.originalname),
        storageKey,
        checksum,
        size: file.size,
        detectedEncoding: detection.encoding,
        detectedDelimiter: detection.delimiter,
        detectedHeaderRow: detection.hasHeader
          ? detection.headerRowNumber
          : null,
        expiresAt: new Date(
          Date.now() + this.config.financeImportSessionTtlHours * 3_600_000,
        ),
      });
      await this.prisma.$transaction((transaction) =>
        this.audit.record(transaction, {
          action: 'FINANCE_IMPORT_CREATED',
          householdId: account.householdId,
          userId,
          entityType: 'FinanceImportSession',
          entityId: id,
          metadata: {
            importId: id,
            accountId: account.id,
            sourceKind: input.sourceKind,
          },
        }),
      );
      return {
        id: session.id,
        account: { id: account.id, name: account.name, type: account.type },
        sourceKind: session.sourceKind,
        status: session.status,
        originalFilename: session.originalFilename,
        fileSizeBytes: session.fileSizeBytes.toString(),
        repeatedFile: Boolean(
          await this.sessions.findCompletedFile(
            account.householdId,
            account.id,
            checksum,
            id,
          ),
        ),
        detectedFormat: detection,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      await this.files.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }
}

function validateFile(
  file: Express.Multer.File | undefined,
  maxBytes: number,
): asserts file is Express.Multer.File {
  if (!file || file.size === 0)
    throw financeImportInvalid('Vyberte neprázdný CSV soubor.');
  if (file.size > maxBytes)
    throw financeImportInvalid('CSV soubor překročil povolenou velikost.');
  if (
    ![
      'text/csv',
      'text/plain',
      'application/csv',
      'application/vnd.ms-excel',
    ].includes(file.mimetype)
  )
    throw financeImportInvalid('Soubor musí být textové CSV.');
  if (file.buffer.includes(0))
    throw financeImportInvalid('Binární soubor nelze importovat jako CSV.');
}

function sanitizeFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).at(-1) ?? 'import.csv';
  return (
    Array.from(basename)
      .filter((character) => {
        const code = character.codePointAt(0) ?? 0;
        return code > 31 && code !== 127;
      })
      .join('')
      .trim()
      .slice(0, 240) || 'import.csv'
  );
}
