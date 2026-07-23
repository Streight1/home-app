import { Injectable } from '@nestjs/common';
import type {
  ExtractedPage,
  LayoutRegion,
  LayoutTableCandidate,
  LayoutTextBlock,
  LayoutTextLine,
} from '../../domain/extraction.types.js';

function bounds(blocks: readonly LayoutTextBlock[]) {
  const x = Math.min(...blocks.map((block) => block.x));
  const y = Math.min(...blocks.map((block) => block.y));
  const right = Math.max(...blocks.map((block) => block.x + block.width));
  const top = Math.max(...blocks.map((block) => block.y + block.height));
  return { x, y, width: right - x, height: top - y };
}

@Injectable()
export class LayoutAnalysisService {
  public analyze(
    page: number,
    blocks: readonly LayoutTextBlock[],
  ): ExtractedPage {
    const lines = this.lines(page, blocks);
    const text = lines.map((line) => line.text).join('\n');
    return {
      page,
      text,
      blocks,
      lines,
      regions: this.regions(page, lines),
      tables: this.tables(page, lines),
    };
  }

  private lines(
    page: number,
    blocks: readonly LayoutTextBlock[],
  ): LayoutTextLine[] {
    const rows: LayoutTextBlock[][] = [];
    for (const block of [...blocks].sort((a, b) => b.y - a.y || a.x - b.x)) {
      const row = rows.find(
        (candidate) => Math.abs((candidate[0]?.y ?? block.y) - block.y) <= 4,
      );
      if (row) row.push(block);
      else rows.push([block]);
    }
    return rows.map((row) => {
      row.sort((a, b) => a.x - b.x || a.order - b.order);
      return {
        page,
        ...bounds(row),
        text: row
          .map((block) => block.text.trim())
          .filter(Boolean)
          .join(' '),
        blocks: row,
      };
    });
  }

  private regions(
    page: number,
    lines: readonly LayoutTextLine[],
  ): LayoutRegion[] {
    if (lines.length === 0) return [];
    const maximumY = Math.max(...lines.map((line) => line.y + line.height));
    const minimumY = Math.min(...lines.map((line) => line.y));
    const span = Math.max(1, maximumY - minimumY);
    return (['HEADER', 'BODY', 'FOOTER'] as const).map((kind, index) => {
      const upper = maximumY - (span * index) / 3;
      const lower = maximumY - (span * (index + 1)) / 3;
      const selected = lines.filter(
        (line) => line.y <= upper && line.y >= lower,
      );
      return {
        page,
        kind,
        ...(selected.length > 0
          ? bounds(selected.flatMap((line) => line.blocks))
          : { x: 0, y: lower, width: 0, height: upper - lower }),
        text: selected.map((line) => line.text).join('\n'),
      };
    });
  }

  private tables(
    page: number,
    lines: readonly LayoutTextLine[],
  ): LayoutTableCandidate[] {
    const rows = lines.filter(
      (line) =>
        line.blocks.length >= 3 ||
        line.text.includes('|') ||
        /\s{2,}/.test(line.text),
    );
    return rows.length >= 2
      ? [
          {
            page,
            rows,
            columnCount: Math.max(
              ...rows.map((row) =>
                row.text.includes('|')
                  ? row.text.split('|').length
                  : row.blocks.length,
              ),
            ),
          },
        ]
      : [];
  }
}
