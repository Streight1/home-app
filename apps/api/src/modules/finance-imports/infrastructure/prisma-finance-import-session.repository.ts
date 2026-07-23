import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type {
  CsvFormatSettings,
  ImportMappingSettings,
  NormalizedImportRow,
} from '../domain/finance-import.types.js';
import type { ImportPreviewQueryDto } from '../presentation/dto/import-preview.dto.js';
import type { UpdateImportRowDto } from '../presentation/dto/update-import-row.dto.js';

@Injectable()
export class PrismaFinanceImportSessionRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public create(input: {
    id: string;
    householdId: string;
    accountId: string;
    userId: string;
    sourceKind: 'BANK_ACCOUNT' | 'CREDIT_CARD';
    originalFilename: string;
    storageKey: string;
    checksum: string;
    size: number;
    detectedEncoding: string;
    detectedDelimiter: string;
    detectedHeaderRow: number | null;
    expiresAt: Date;
  }) {
    return this.prisma.financeImportSession.create({
      data: {
        id: input.id,
        householdId: input.householdId,
        accountId: input.accountId,
        createdByUserId: input.userId,
        sourceKind: input.sourceKind,
        originalFilename: input.originalFilename,
        temporaryStorageKey: input.storageKey,
        fileChecksumSha256: input.checksum,
        fileSizeBytes: input.size,
        detectedEncoding: input.detectedEncoding,
        detectedDelimiter: input.detectedDelimiter,
        detectedHeaderRow: input.detectedHeaderRow,
        expiresAt: input.expiresAt,
      },
    });
  }

  public findById(id: string) {
    return this.prisma.financeImportSession.findUnique({
      where: { id },
      include: {
        account: {
          select: { id: true, name: true, type: true, currencyCode: true },
        },
        profile: { select: { id: true, name: true } },
      },
    });
  }

  public find(householdId: string, id: string) {
    return this.prisma.financeImportSession.findFirst({
      where: { id, householdId },
      include: {
        account: {
          select: { id: true, name: true, type: true, currencyCode: true },
        },
        profile: { select: { id: true, name: true } },
      },
    });
  }

  public findCompletedFile(
    householdId: string,
    accountId: string,
    checksum: string,
    exceptId?: string,
  ) {
    return this.prisma.financeImportSession.findFirst({
      where: {
        householdId,
        accountId,
        fileChecksumSha256: checksum,
        status: 'COMPLETED',
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true, committedAt: true },
    });
  }

  public updateFormat(id: string, format: CsvFormatSettings) {
    return this.prisma.financeImportSession.update({
      where: { id },
      data: { ...format, status: 'CONFIGURING' },
    });
  }

  public async replaceRows(input: {
    sessionId: string;
    profileId: string | null;
    mapping: ImportMappingSettings;
    rows: readonly NormalizedImportRow[];
  }): Promise<void> {
    const counts = countRows(input.rows);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.financeImportRow.deleteMany({
        where: { importSessionId: input.sessionId },
      });
      for (let offset = 0; offset < input.rows.length; offset += 1_000) {
        const chunk = input.rows.slice(offset, offset + 1_000);
        await transaction.financeImportRow.createMany({
          data: chunk.map((row) => ({
            importSessionId: input.sessionId,
            rowNumber: row.rowNumber,
            status: row.status,
            externalTransactionId: row.externalTransactionId,
            bookedDate: row.bookedDate,
            transactionDate: row.transactionDate,
            amountMinor: row.amountMinor,
            currencyCode: row.currencyCode,
            transactionType: row.transactionType,
            counterpartyName: row.counterpartyName,
            counterpartyAccount: row.counterpartyAccount,
            description: row.description,
            variableSymbol: row.variableSymbol,
            constantSymbol: row.constantSymbol,
            specificSymbol: row.specificSymbol,
            merchantNormalizedName: row.merchantNormalizedName,
            categoryId: row.categoryId,
            fingerprint: row.fingerprint,
            duplicateTransactionId: row.duplicateTransactionId,
            validationErrorsJson: row.validationErrors as Prisma.InputJsonValue,
            userIncluded: row.userIncluded,
          })),
        });
      }
      await transaction.financeImportSession.update({
        where: { id: input.sessionId },
        data: {
          profileId: input.profileId,
          amountColumnMode: input.mapping.amountColumnMode,
          columnMappingJson: input.mapping
            .columnMapping as Prisma.InputJsonValue,
          invertAmountSign: input.mapping.invertAmountSign,
          defaultCurrencyCode: input.mapping.defaultCurrencyCode,
          status: 'READY_FOR_REVIEW',
          ...counts,
        },
      });
    });
  }

  public async preview(sessionId: string, query: ImportPreviewQueryDto) {
    const where: Prisma.FinanceImportRowWhereInput = {
      importSessionId: sessionId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.financeImportRow.findMany({
        where,
        orderBy: { rowNumber: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: publicRowSelect,
      }),
      this.prisma.financeImportRow.count({ where }),
    ]);
    return {
      items: items.map(mapRow),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  public findRow(sessionId: string, rowId: string) {
    return this.prisma.financeImportRow.findFirst({
      where: { id: rowId, importSessionId: sessionId },
    });
  }

  public async updateRow(
    sessionId: string,
    rowId: string,
    input: UpdateImportRowDto,
  ): Promise<boolean> {
    const data: Prisma.FinanceImportRowUncheckedUpdateManyInput = {
      ...(input.userIncluded === undefined
        ? {}
        : { userIncluded: input.userIncluded }),
      ...(input.categoryId === undefined
        ? {}
        : { categoryId: input.categoryId }),
      ...(input.transactionType === undefined
        ? {}
        : { transactionType: input.transactionType }),
      ...(input.transferSourceAccountId === undefined
        ? {}
        : { transferSourceAccountId: input.transferSourceAccountId }),
      ...(input.matchingTransactionId === undefined
        ? {}
        : { matchingTransactionId: input.matchingTransactionId }),
      ...(input.transactionType === 'TRANSFER_IN'
        ? { status: 'NEEDS_TRANSFER_REVIEW' }
        : input.transactionType
          ? { status: 'VALID' }
          : {}),
    };
    const result = await this.prisma.financeImportRow.updateMany({
      where: { id: rowId, importSessionId: sessionId },
      data,
    });
    await this.refreshCounts(sessionId);
    return result.count > 0;
  }

  public async bulkCategory(
    sessionId: string,
    rowIds: readonly string[],
    categoryId: string,
  ): Promise<number> {
    const result = await this.prisma.financeImportRow.updateMany({
      where: { id: { in: [...rowIds] }, importSessionId: sessionId },
      data: { categoryId },
    });
    return result.count;
  }

  public rowsForCommit(sessionId: string) {
    return this.prisma.financeImportRow.findMany({
      where: {
        importSessionId: sessionId,
        userIncluded: true,
        status: {
          in: ['VALID', 'POSSIBLE_DUPLICATE', 'NEEDS_TRANSFER_REVIEW'],
        },
      },
      orderBy: { rowNumber: 'asc' },
    });
  }

  public claimCommit(id: string) {
    return this.prisma.financeImportSession.updateMany({
      where: { id, status: 'READY_FOR_REVIEW' },
      data: { status: 'COMMITTING' },
    });
  }

  public async markCompleted(id: string, importedRowCount: number) {
    await this.prisma.$transaction([
      this.prisma.financeImportRow.updateMany({
        where: {
          importSessionId: id,
          userIncluded: true,
          status: {
            in: ['VALID', 'POSSIBLE_DUPLICATE', 'NEEDS_TRANSFER_REVIEW'],
          },
        },
        data: { status: 'IMPORTED' },
      }),
      this.prisma.financeImportRow.updateMany({
        where: { importSessionId: id, userIncluded: false },
        data: { status: 'SKIPPED' },
      }),
      this.prisma.financeImportSession.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          importedRowCount,
          committedAt: new Date(),
          temporaryStorageKey: null,
        },
      }),
    ]);
  }

  public markCancelled(id: string) {
    return this.prisma.financeImportSession.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        temporaryStorageKey: null,
      },
    });
  }

  public async listHistory(
    householdId: string,
    page: number,
    pageSize: number,
  ) {
    const where = { householdId };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.financeImportSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          account: {
            select: { id: true, name: true, type: true, currencyCode: true },
          },
          profile: { select: { id: true, name: true } },
        },
      }),
      this.prisma.financeImportSession.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  public expired(now: Date) {
    return this.prisma.financeImportSession.findMany({
      where: {
        expiresAt: { lte: now },
        status: {
          in: ['UPLOADED', 'CONFIGURING', 'READY_FOR_REVIEW', 'FAILED'],
        },
      },
      select: { id: true, temporaryStorageKey: true },
    });
  }

  public expire(id: string) {
    return this.prisma.financeImportSession.update({
      where: { id },
      data: { status: 'EXPIRED', temporaryStorageKey: null },
    });
  }

  private async refreshCounts(sessionId: string): Promise<void> {
    const [validRowCount, invalidRowCount, duplicateRowCount, ignoredRowCount] =
      await this.prisma.$transaction([
        this.prisma.financeImportRow.count({
          where: { importSessionId: sessionId, status: 'VALID' },
        }),
        this.prisma.financeImportRow.count({
          where: { importSessionId: sessionId, status: 'INVALID' },
        }),
        this.prisma.financeImportRow.count({
          where: {
            importSessionId: sessionId,
            status: 'POSSIBLE_DUPLICATE',
          },
        }),
        this.prisma.financeImportRow.count({
          where: { importSessionId: sessionId, userIncluded: false },
        }),
      ]);
    await this.prisma.financeImportSession.update({
      where: { id: sessionId },
      data: {
        validRowCount,
        invalidRowCount,
        duplicateRowCount,
        ignoredRowCount,
      },
    });
  }
}

const publicRowSelect = {
  id: true,
  rowNumber: true,
  status: true,
  externalTransactionId: true,
  bookedDate: true,
  transactionDate: true,
  amountMinor: true,
  currencyCode: true,
  transactionType: true,
  counterpartyName: true,
  counterpartyAccount: true,
  description: true,
  variableSymbol: true,
  constantSymbol: true,
  specificSymbol: true,
  categoryId: true,
  duplicateTransactionId: true,
  transferSourceAccountId: true,
  matchingTransactionId: true,
  userIncluded: true,
  validationErrorsJson: true,
} satisfies Prisma.FinanceImportRowSelect;

const mapRow = (
  row: Prisma.FinanceImportRowGetPayload<{ select: typeof publicRowSelect }>,
) => ({
  ...row,
  amountMinor: row.amountMinor?.toString() ?? null,
  bookedDate: row.bookedDate?.toISOString().slice(0, 10) ?? null,
  transactionDate: row.transactionDate?.toISOString().slice(0, 10) ?? null,
});

function countRows(rows: readonly NormalizedImportRow[]) {
  return {
    totalRowCount: rows.length,
    validRowCount: rows.filter((row) => row.status === 'VALID').length,
    invalidRowCount: rows.filter((row) => row.status === 'INVALID').length,
    duplicateRowCount: rows.filter((row) => row.status === 'POSSIBLE_DUPLICATE')
      .length,
    ignoredRowCount: rows.filter((row) => !row.userIncluded).length,
  };
}
