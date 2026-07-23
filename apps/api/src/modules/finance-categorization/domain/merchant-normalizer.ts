const terminalPrefixes = [
  /^POS\s*[-:]?\s*/i,
  /^CARD PAYMENT\s*[-:]?\s*/i,
  /^PLATBA KARTOU\s*[-:]?\s*/i,
];

export function normalizeMerchantName(value: string | null): string | null {
  if (!value) return null;
  let normalized = value.trim().replace(/\s+/g, ' ');
  for (const prefix of terminalPrefixes)
    normalized = normalized.replace(prefix, '');
  normalized = normalized.trim().toLocaleLowerCase('cs-CZ');
  return normalized || null;
}

export function normalizeRuleValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('cs-CZ');
}
