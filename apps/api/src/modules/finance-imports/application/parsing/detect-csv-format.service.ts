import { Injectable } from '@nestjs/common';
import type { CsvFormatSettings } from '../../domain/finance-import.types.js';
import { decodeCsv, parseCsvRecords } from './csv-parser.js';

@Injectable()
export class DetectCsvFormatService {
  public detect(buffer: Buffer): {
    encoding: CsvFormatSettings['encoding'];
    delimiter: CsvFormatSettings['delimiter'];
    hasHeader: boolean;
    headerRowNumber: number;
    sampleRows: string[][];
  } {
    const encoding = detectEncoding(buffer);
    const source = decodeCsv(buffer, encoding);
    const delimiter = detectDelimiter(source);
    const sampleRows = parseCsvRecords(source, delimiter, '"', 20).slice(0, 8);
    return {
      encoding,
      delimiter,
      hasHeader: looksLikeHeader(sampleRows),
      headerRowNumber: 1,
      sampleRows,
    };
  }
}

function detectEncoding(buffer: Buffer): CsvFormatSettings['encoding'] {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])))
    return 'utf-8';
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return 'utf-8';
  } catch {
    return 'windows-1250';
  }
}

function detectDelimiter(source: string): CsvFormatSettings['delimiter'] {
  const firstLines = source.split(/\r?\n/).slice(0, 8);
  const candidates = [',', ';', '\t'] as const;
  return (
    candidates
      .map((delimiter) => ({
        delimiter,
        count: firstLines.reduce(
          (total, line) => total + countOutsideQuotes(line, delimiter),
          0,
        ),
      }))
      .sort((left, right) => right.count - left.count)[0]?.delimiter ?? ';'
  );
}

function countOutsideQuotes(source: string, delimiter: string): number {
  let quoted = false;
  let count = 0;
  for (const character of source) {
    if (character === '"') quoted = !quoted;
    else if (character === delimiter && !quoted) count += 1;
  }
  return count;
}

function looksLikeHeader(rows: readonly string[][]): boolean {
  const first = rows[0] ?? [];
  const second = rows[1] ?? [];
  const firstLetters = first.filter((value) =>
    /[A-Za-zÁ-ž]/.test(value),
  ).length;
  const secondData = second.filter((value) => /\d/.test(value)).length;
  return (
    first.length > 1 &&
    firstLetters >= Math.ceil(first.length / 2) &&
    secondData > 0
  );
}
