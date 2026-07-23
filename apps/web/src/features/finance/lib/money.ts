import type { FinanceCurrency } from '../types/finance.types.js';

const MONEY_INPUT = /^-?\d+(?:[,.]\d{1,2})?$/;

export function parseMoneyInputToMinorUnits(value: string): string {
  const normalized = value.replace(/[\s\u00a0\u202f]/g, '');
  if (!MONEY_INPUT.test(normalized))
    throw new Error('Částka nemá platný formát.');
  const negative = normalized.startsWith('-');
  const [whole = '0', fraction = ''] = normalized
    .replace('-', '')
    .split(/[,.]/);
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return (negative ? -amount : amount).toString();
}

export function formatMinorUnits(
  value: string,
  currencyCode: FinanceCurrency,
): string {
  const amount = BigInt(value);
  const absolute = amount < 0n ? -amount : amount;
  const whole = absolute / 100n;
  const fraction = String(absolute % 100n).padStart(2, '0');
  const grouped = new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: 0,
  }).format(whole);
  const currency = currencyCode === 'CZK' ? 'Kč' : '€';
  return `${amount < 0n ? '−' : ''}${grouped},${fraction} ${currency}`;
}

export const compareMoney = (left: string, right: string): -1 | 0 | 1 =>
  BigInt(left) < BigInt(right) ? -1 : BigInt(left) > BigInt(right) ? 1 : 0;

export const addMoney = (left: string, right: string): string =>
  (BigInt(left) + BigInt(right)).toString();

export const subtractMoney = (left: string, right: string): string =>
  (BigInt(left) - BigInt(right)).toString();

export function minorUnitsToInput(value: string): string {
  const amount = BigInt(value);
  const absolute = amount < 0n ? -amount : amount;
  return `${amount < 0n ? '-' : ''}${(absolute / 100n).toString()},${String(absolute % 100n).padStart(2, '0')}`;
}
