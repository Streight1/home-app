import { Injectable } from '@nestjs/common';
import { normalizeMerchantName } from '../../../finance-categorization/finance-categorization.public.js';
import {
  dateOnly,
  dateOnlyString,
} from '../../../finance/domain/finance.types.js';
import type {
  CsvFormatSettings,
  FinanceImportColumnMapping,
  ImportMappingSettings,
  NormalizedImportRow,
} from '../../domain/finance-import.types.js';
import { CalculateTransactionFingerprintService } from '../deduplication/calculate-transaction-fingerprint.service.js';

@Injectable()
export class NormalizeImportRowService {
  public constructor(
    private readonly fingerprints: CalculateTransactionFingerprintService,
  ) {}

  public normalize(input: {
    accountId: string;
    accountType: string;
    accountCurrency: string;
    rowNumber: number;
    values: ReadonlyMap<string, string>;
    format: CsvFormatSettings;
    mapping: ImportMappingSettings;
  }): NormalizedImportRow {
    const read = (field: keyof FinanceImportColumnMapping) => {
      const column = input.mapping.columnMapping[field];
      return column ? clean(input.values.get(column) ?? null) : null;
    };
    const errors: string[] = [];
    const booked = parseDate(
      read('bookedDate') ?? read('transactionDate'),
      input.format.dateFormat,
    );
    const transactionDate = parseDate(
      read('transactionDate'),
      input.format.dateFormat,
    );
    if (!booked) errors.push('IMPORT_DATE_INVALID');
    const amount = resolveAmount(read, input.format, input.mapping);
    if (!amount || amount.minor === 0n) errors.push('IMPORT_AMOUNT_INVALID');
    const currencyCode = (
      read('currencyCode') ??
      input.mapping.defaultCurrencyCode ??
      input.accountCurrency
    ).toUpperCase();
    if (!['CZK', 'EUR'].includes(currencyCode))
      errors.push('IMPORT_CURRENCY_INVALID');
    if (currencyCode !== input.accountCurrency)
      errors.push('IMPORT_CURRENCY_MISMATCH');
    const direction = amount
      ? resolveType(
          amount.minor,
          read('transactionType'),
          input.mapping.amountColumnMode,
          input.accountType,
        )
      : null;
    const absoluteAmount = amount?.minor
      ? amount.minor < 0n
        ? -amount.minor
        : amount.minor
      : null;
    const counterpartyName = read('counterpartyName');
    const normalized: NormalizedImportRow = {
      rowNumber: input.rowNumber,
      status:
        errors.length > 0
          ? 'INVALID'
          : direction?.review
            ? 'NEEDS_TRANSFER_REVIEW'
            : 'VALID',
      externalTransactionId: read('externalTransactionId'),
      bookedDate: booked,
      transactionDate,
      amountMinor: absoluteAmount,
      currencyCode,
      transactionType: direction?.type ?? null,
      counterpartyName,
      counterpartyAccount: read('counterpartyAccount'),
      description: read('description'),
      variableSymbol: digits(read('variableSymbol'), 20),
      constantSymbol: digits(read('constantSymbol'), 20),
      specificSymbol: digits(read('specificSymbol'), 20),
      merchantNormalizedName: normalizeMerchantName(counterpartyName),
      categoryId: null,
      fingerprint: null,
      duplicateTransactionId: null,
      validationErrors: errors,
      userIncluded: errors.length === 0 && !direction?.review,
    };
    if (booked && absoluteAmount && errors.length === 0) {
      normalized.fingerprint = this.fingerprints.calculate({
        accountId: input.accountId,
        bookedDate: dateOnlyString(booked),
        transactionDate: transactionDate
          ? dateOnlyString(transactionDate)
          : null,
        amountMinor: absoluteAmount,
        currencyCode,
        counterpartyName,
        counterpartyAccount: normalized.counterpartyAccount,
        variableSymbol: normalized.variableSymbol,
        description: normalized.description,
      });
    }
    return normalized;
  }
}

function resolveAmount(
  read: (field: keyof FinanceImportColumnMapping) => string | null,
  format: CsvFormatSettings,
  mapping: ImportMappingSettings,
): { minor: bigint } | null {
  let value: bigint | null = null;
  if (mapping.amountColumnMode === 'SIGNED_AMOUNT')
    value = parseMoney(read('signedAmount'), format);
  if (mapping.amountColumnMode === 'SEPARATE_DEBIT_CREDIT') {
    const debit = parseMoney(read('debitAmount'), format);
    const credit = parseMoney(read('creditAmount'), format);
    value = debit && debit !== 0n ? -abs(debit) : credit ? abs(credit) : null;
  }
  if (mapping.amountColumnMode === 'TRANSACTION_TYPE_AND_AMOUNT')
    value = parseMoney(read('signedAmount'), format);
  if (value !== null && mapping.invertAmountSign) value = -value;
  return value === null ? null : { minor: value };
}

export function parseMoney(
  raw: string | null,
  format: Pick<CsvFormatSettings, 'decimalSeparator' | 'thousandSeparator'>,
): bigint | null {
  if (!raw) return null;
  let value = raw.replace(/\u00a0/g, ' ').trim();
  if (format.thousandSeparator)
    value = value.split(format.thousandSeparator).join('');
  value = value.replace(/\s/g, '');
  if (format.decimalSeparator !== '.') value = value.replace(',', '.');
  if (!/^[+-]?\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const negative = value.startsWith('-');
  const unsigned = value.replace(/^[+-]/, '');
  const [whole, fraction = ''] = unsigned.split('.');
  if (whole === undefined) return null;
  const minor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return negative ? -minor : minor;
}

export function parseDate(
  raw: string | null,
  format: CsvFormatSettings['dateFormat'],
): Date | null {
  if (!raw) return null;
  let year: number;
  let month: number;
  let day: number;
  if (format === 'YYYY-MM-DD') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) return null;
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    const separator = format === 'DD/MM/YYYY' ? '/' : '.';
    const parts = raw.split(separator).map(Number);
    if (parts.length !== 3) return null;
    const [parsedDay, parsedMonth, parsedYear] = parts;
    if (
      parsedDay === undefined ||
      parsedMonth === undefined ||
      parsedYear === undefined
    )
      return null;
    day = parsedDay;
    month = parsedMonth;
    year = parsedYear;
  }
  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = dateOnly(iso);
  return Number.isNaN(parsed.getTime()) || dateOnlyString(parsed) !== iso
    ? null
    : parsed;
}

function resolveType(
  signedMinor: bigint,
  label: string | null,
  mode: ImportMappingSettings['amountColumnMode'],
  accountType: string,
): { type: 'EXPENSE' | 'INCOME' | 'REFUND'; review: boolean } {
  const normalized = (label ?? '').toLocaleLowerCase('cs-CZ');
  if (mode === 'TRANSACTION_TYPE_AND_AMOUNT') {
    if (/refund|vrác|storno/.test(normalized))
      return { type: 'REFUND', review: false };
    if (/debet|debit|výdaj|nákup/.test(normalized))
      return { type: 'EXPENSE', review: false };
    if (/kredit|credit|příjem/.test(normalized)) {
      return accountType === 'CREDIT_CARD'
        ? { type: 'REFUND', review: true }
        : { type: 'INCOME', review: false };
    }
  }
  if (signedMinor < 0n) return { type: 'EXPENSE', review: false };
  return accountType === 'CREDIT_CARD'
    ? { type: 'REFUND', review: true }
    : { type: 'INCOME', review: false };
}

const abs = (value: bigint): bigint => (value < 0n ? -value : value);
const clean = (value: string | null): string | null => {
  const cleaned = stripControlCharacters(value ?? '').trim();
  return cleaned ? cleaned.slice(0, 1_000) : null;
};
const digits = (value: string | null, limit: number): string | null => {
  const normalized = value?.replace(/\D/g, '').slice(0, limit) ?? '';
  return normalized || null;
};

const stripControlCharacters = (value: string): string =>
  Array.from(value)
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code > 31 && code !== 127;
    })
    .join('');
