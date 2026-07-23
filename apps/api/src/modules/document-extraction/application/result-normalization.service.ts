import { Injectable } from '@nestjs/common';

export function normalizeCzechDate(value: string): string | null {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const czech = /^(\d{1,2})[./]\s*(\d{1,2})[./]\s*(\d{4})$/.exec(trimmed);
  const parts = iso
    ? [iso[1], iso[2], iso[3]]
    : czech
      ? [czech[3], czech[2], czech[1]]
      : null;
  if (!parts?.every(Boolean)) return null;
  const [year, month, day] = parts as [string, string, string];
  const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === normalized ? normalized : null;
}

export function normalizeAmountMinor(value: string): number | null {
  let normalized = value
    .trim()
    .replace(/[\s\u00a0]/g, '')
    .replace(/(?:Kč|CZK|EUR|€)$/i, '');
  if (!/^-?[\d.,]+$/.test(normalized)) return null;
  const negative = normalized.startsWith('-');
  normalized = normalized.replace('-', '');
  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  const separator = Math.max(lastComma, lastDot);
  let whole = normalized;
  let fraction = '';
  if (separator >= 0 && normalized.length - separator - 1 <= 2) {
    whole = normalized.slice(0, separator);
    fraction = normalized.slice(separator + 1);
  }
  whole = whole.replace(/[.,]/g, '') || '0';
  fraction = fraction.padEnd(2, '0').slice(0, 2);
  const minor = BigInt(whole) * 100n + BigInt(fraction || '0');
  const signed = negative ? -minor : minor;
  return signed <= BigInt(Number.MAX_SAFE_INTEGER) &&
    signed >= BigInt(Number.MIN_SAFE_INTEGER)
    ? Number(signed)
    : null;
}

@Injectable()
export class ResultNormalizationService {
  public normalizeDate(value: string): string | null {
    return normalizeCzechDate(value);
  }
  public normalizeAmount(value: string): number | null {
    return normalizeAmountMinor(value);
  }
  public normalizeCurrency(value: string): string | null {
    if (/\bEUR\b|€/i.test(value)) return 'EUR';
    if (/\bCZK\b|Kč/i.test(value)) return 'CZK';
    return null;
  }
}
