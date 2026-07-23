export function formatFileSize(bytes: number): string {
  if (bytes < 1_024) return `${String(bytes)} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} kB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function formatDocumentDate(value: string): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDocumentAmount(
  minorUnits: number,
  currencyCode: string,
): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(minorUnits / 100);
}

const typeLabels = new Map([
  ['application/pdf', 'PDF'],
  ['image/jpeg', 'JPEG'],
  ['image/png', 'PNG'],
  ['text/plain', 'Text'],
  [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Word',
  ],
  [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Excel',
  ],
]);

export function formatDocumentType(mimeType: string): string {
  return typeLabels.get(mimeType) ?? 'Soubor';
}
