import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type {
  CreateImportProfileDto,
  UpdateImportProfileDto,
} from '../presentation/dto/import-profile.dto.js';

@Injectable()
export class PrismaFinanceImportProfileRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public list(householdId: string) {
    return this.prisma.financeImportProfile.findMany({
      where: { householdId },
      orderBy: { name: 'asc' },
      select: profileSelect,
    });
  }

  public find(householdId: string, id: string) {
    return this.prisma.financeImportProfile.findFirst({
      where: { id, householdId },
      select: profileSelect,
    });
  }

  public create(
    householdId: string,
    userId: string,
    input: CreateImportProfileDto,
  ) {
    return this.prisma.financeImportProfile.create({
      data: {
        ...mapProfileInput(input),
        accountId: input.accountId ?? null,
        defaultCurrencyCode: input.defaultCurrencyCode ?? null,
        householdId,
        createdByUserId: userId,
        columnMappingJson: input.columnMapping as Prisma.InputJsonValue,
      },
      select: profileSelect,
    });
  }

  public async update(
    householdId: string,
    id: string,
    input: UpdateImportProfileDto,
  ) {
    const existing = await this.prisma.financeImportProfile.findFirst({
      where: { id, householdId },
      select: { id: true },
    });
    if (!existing) return null;
    return this.prisma.financeImportProfile.update({
      where: { id },
      data: {
        ...mapProfileInput(input),
        accountId: input.accountId ?? null,
        defaultCurrencyCode: input.defaultCurrencyCode ?? null,
        columnMappingJson: input.columnMapping as Prisma.InputJsonValue,
      },
      select: profileSelect,
    });
  }

  public delete(householdId: string, id: string) {
    return this.prisma.financeImportProfile.deleteMany({
      where: { id, householdId },
    });
  }
}

const profileSelect = {
  id: true,
  name: true,
  accountId: true,
  sourceKind: true,
  encoding: true,
  delimiter: true,
  quoteCharacter: true,
  hasHeader: true,
  headerRowNumber: true,
  skipRowsBefore: true,
  dateFormat: true,
  decimalSeparator: true,
  thousandSeparator: true,
  amountColumnMode: true,
  columnMappingJson: true,
  invertAmountSign: true,
  defaultCurrencyCode: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FinanceImportProfileSelect;

function mapProfileInput(input: CreateImportProfileDto) {
  return {
    name: input.name,
    sourceKind: input.sourceKind,
    encoding: input.encoding,
    delimiter: input.delimiter,
    quoteCharacter: input.quoteCharacter,
    hasHeader: input.hasHeader,
    headerRowNumber: input.headerRowNumber,
    skipRowsBefore: input.skipRowsBefore,
    dateFormat: input.dateFormat,
    decimalSeparator: input.decimalSeparator,
    thousandSeparator: input.thousandSeparator,
    amountColumnMode: input.amountColumnMode,
    invertAmountSign: input.invertAmountSign,
  };
}
