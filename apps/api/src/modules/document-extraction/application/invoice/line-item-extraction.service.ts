import { Injectable } from '@nestjs/common';
import type {
  ExtractedLineItem,
  ExtractedPage,
  LayoutTextLine,
} from '../../domain/extraction.types.js';
import { InvoiceNormalizationService } from '../normalization/invoice-normalizers.js';

function cells(line: LayoutTextLine): string[] {
  if (line.text.includes('|'))
    return line.text
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean);
  if (line.blocks.length >= 3)
    return line.blocks.map((block) => block.text.trim()).filter(Boolean);
  return line.text
    .split(/\s{2,}/)
    .map((cell) => cell.trim())
    .filter(Boolean);
}

@Injectable()
export class LineItemExtractionService {
  public constructor(
    private readonly normalization: InvoiceNormalizationService,
  ) {}
  public extract(pages: readonly ExtractedPage[]): {
    items: ExtractedLineItem[];
    sourceLine: LayoutTextLine | null;
  } {
    const items: ExtractedLineItem[] = [];
    let sourceLine: LayoutTextLine | null = null;
    for (const page of pages) {
      for (const line of page.lines) {
        const parts = cells(line);
        if (
          parts.length < 3 ||
          /popis|položka|description/i.test(parts[0] ?? '')
        )
          continue;
        const amountIndexes = parts
          .map((part, index) => ({
            index,
            value: this.normalization.money.normalize(part),
          }))
          .filter(
            (entry): entry is { index: number; value: number } =>
              entry.value !== null,
          );
        if (amountIndexes.length === 0) continue;
        const last = amountIndexes.at(-1);
        if (!last || last.index === 0) continue;
        const firstAmountIndex = amountIndexes[0]?.index ?? 1;
        const description =
          firstAmountIndex >= 3 && /^\d+(?:[.,]\d+)?$/.test(parts[1] ?? '')
            ? (parts[0]?.trim() ?? '')
            : parts.slice(0, firstAmountIndex).join(' ').trim();
        if (
          !description ||
          /celkem|dph|základ|subtotal|total/i.test(description)
        )
          continue;
        const item: ExtractedLineItem = {
          description: description.slice(0, 500),
          totalAmountMinor: last.value,
        };
        const quantity = parts[1];
        if (quantity && /^\d+(?:[.,]\d+)?$/.test(quantity))
          item.quantity = quantity;
        const unit = parts[2];
        if (unit && /^[a-zA-Zá-žÁ-Ž]{1,10}$/.test(unit)) item.unit = unit;
        const unitPrice =
          amountIndexes.length > 1 ? amountIndexes.at(-2)?.value : undefined;
        if (unitPrice !== undefined) item.unitPriceMinor = unitPrice;
        const vat = parts.find((part) =>
          /^\d{1,2}(?:[.,]\d+)?\s*%$/.test(part),
        );
        if (vat) item.vatRate = vat.replace(/\s/g, '');
        items.push(item);
        sourceLine ??= line;
      }
    }
    return { items: items.slice(0, 200), sourceLine };
  }
}
