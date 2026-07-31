export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('cs-CZ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function safeSearchSnippet(value: string, maximumLength = 180): string {
  const plain = value
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maximumLength) return plain;
  return `${plain.slice(0, maximumLength - 1).trimEnd()}…`;
}
