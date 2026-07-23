import {
  financeImportFields,
  type CsvFormatSettings,
  type FinanceImportColumnMapping,
} from '../../domain/finance-import.types.js';
import {
  financeImportConflict,
  financeImportInvalid,
} from '../../domain/finance-import.errors.js';
import type { PrismaFinanceImportSessionRepository } from '../../infrastructure/prisma-finance-import-session.repository.js';
import type { ConfigureImportMappingDto } from '../../presentation/dto/configure-import-mapping.dto.js';

export type WritableImportSession = NonNullable<
  Awaited<ReturnType<PrismaFinanceImportSessionRepository['findById']>>
>;

export function requireImportFormat(
  session: WritableImportSession,
): CsvFormatSettings {
  if (
    !session.encoding ||
    !session.delimiter ||
    !session.dateFormat ||
    !session.decimalSeparator ||
    session.hasHeader === null
  )
    throw financeImportConflict('Nejprve nastavte formát CSV.');
  return {
    encoding: session.encoding as CsvFormatSettings['encoding'],
    delimiter: session.delimiter as CsvFormatSettings['delimiter'],
    quoteCharacter: '"',
    hasHeader: session.hasHeader,
    headerRowNumber: session.headerRowNumber ?? 1,
    skipRowsBefore: session.skipRowsBefore ?? 0,
    dateFormat: session.dateFormat as CsvFormatSettings['dateFormat'],
    decimalSeparator: session.decimalSeparator as ',' | '.',
    thousandSeparator: (session.thousandSeparator ??
      '') as CsvFormatSettings['thousandSeparator'],
  };
}

export function buildImportTable(
  records: readonly string[][],
  format: Pick<
    CsvFormatSettings,
    'hasHeader' | 'headerRowNumber' | 'skipRowsBefore'
  >,
): ReadonlyMap<string, string>[] {
  const headerIndex = format.hasHeader ? format.headerRowNumber - 1 : null;
  const headerSource =
    headerIndex === null ? (records[0] ?? []) : (records[headerIndex] ?? []);
  const headers = headerSource.map(
    (value, index) => value.trim() || `Sloupec ${String(index + 1)}`,
  );
  const start = Math.max(
    format.skipRowsBefore,
    headerIndex === null ? 0 : headerIndex + 1,
  );
  return records
    .slice(start)
    .map(
      (row) =>
        new Map(headers.map((header, index) => [header, row[index] ?? ''])),
    );
}

export function validateImportMapping(
  mapping: FinanceImportColumnMapping,
  mode: ConfigureImportMappingDto['amountColumnMode'],
): void {
  if (
    Object.keys(mapping).some(
      (key) => !financeImportFields.includes(key as never),
    )
  )
    throw financeImportInvalid('Mapování obsahuje neznámé pole.');
  if (!mapping.bookedDate && !mapping.transactionDate)
    throw financeImportInvalid('Namapujte datum pohybu.');
  if (
    mode === 'SEPARATE_DEBIT_CREDIT'
      ? !mapping.debitAmount && !mapping.creditAmount
      : !mapping.signedAmount
  )
    throw financeImportInvalid('Namapujte částku pohybu.');
}

export function summarizeImportRows(
  rows: readonly { status: string; userIncluded: boolean }[],
) {
  return {
    total: rows.length,
    valid: rows.filter((row) => row.status === 'VALID').length,
    invalid: rows.filter((row) => row.status === 'INVALID').length,
    possibleDuplicates: rows.filter(
      (row) => row.status === 'POSSIBLE_DUPLICATE',
    ).length,
    transferReview: rows.filter((row) => row.status === 'NEEDS_TRANSFER_REVIEW')
      .length,
    ignored: rows.filter((row) => !row.userIncluded).length,
  };
}
