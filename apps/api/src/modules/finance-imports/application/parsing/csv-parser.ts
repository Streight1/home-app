import { financeImportInvalid } from '../../domain/finance-import.errors.js';

export function decodeCsv(buffer: Buffer, encoding: string): string {
  try {
    return new TextDecoder(encoding, { fatal: true })
      .decode(buffer)
      .replace(/^\uFEFF/, '');
  } catch {
    throw financeImportInvalid('Kódování CSV souboru není platné.');
  }
}

export function parseCsvRecords(
  source: string,
  delimiter: string,
  quote: string,
  maxRows: number,
): string[][] {
  if (source.includes('\0'))
    throw financeImportInvalid('CSV obsahuje nepovolená binární data.');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source.charAt(index);
    if (character === quote) {
      if (quoted && source[index + 1] === quote) {
        field += quote;
        index += 1;
      } else quoted = !quoted;
      continue;
    }
    if (character === delimiter && !quoted) {
      row.push(field);
      field = '';
      continue;
    }
    if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((value) => value.trim().length > 0)) rows.push(row);
      row = [];
      if (rows.length > maxRows)
        throw financeImportInvalid('CSV obsahuje příliš mnoho řádků.');
      continue;
    }
    field += character;
  }
  if (quoted) throw financeImportInvalid('CSV obsahuje neuzavřené uvozovky.');
  row.push(field);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);
  if (rows.length > maxRows)
    throw financeImportInvalid('CSV obsahuje příliš mnoho řádků.');
  if (rows.length === 0) throw financeImportInvalid('CSV soubor je prázdný.');
  return rows;
}
