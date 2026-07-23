import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

const MINOR_UNITS_PATTERN = /^-?\d+$/;

export const parseMinorUnits = (
  value: string,
  options: { allowNegative?: boolean; allowZero?: boolean } = {},
): bigint => {
  if (!MINOR_UNITS_PATTERN.test(value)) throw invalidMoney();
  const amount = BigInt(value);
  if (!options.allowNegative && amount < 0n) throw invalidMoney();
  if (!options.allowZero && amount === 0n) throw invalidMoney();
  return amount;
};

export const parseCzechMoneyInput = (value: string): bigint => {
  const normalized = value.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) throw invalidMoney();
  const negative = normalized.startsWith('-');
  const [whole = '0', fraction = ''] = normalized.replace('-', '').split('.');
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return negative ? -result : result;
};

const invalidMoney = () =>
  new ApiException(
    HttpStatus.BAD_REQUEST,
    'FINANCE_INVALID_INPUT',
    'Částka nemá platný formát.',
  );
