import { Injectable } from '@nestjs/common';
import type { ExtractedLineItem } from '../../domain/extraction.types.js';

function safeDescription(value: string): string {
  return value
    .replace(/\b\d[\d\s.,]*(?:Kč|CZK|EUR|€)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

@Injectable()
export class PurchaseSummaryService {
  public create(items: readonly ExtractedLineItem[]): string | null {
    const descriptions = items
      .map((item) => safeDescription(item.description))
      .filter(Boolean);
    if (descriptions.length === 0) return null;
    if (descriptions.length === 1) return descriptions[0] ?? null;
    if (descriptions.length <= 3) return descriptions.join(', ').slice(0, 300);
    return `${descriptions[0] ?? 'Nákup'} a další položky`.slice(0, 300);
  }
}
