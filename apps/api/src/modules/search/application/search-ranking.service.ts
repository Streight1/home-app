import { Injectable } from '@nestjs/common';
import type {
  ModuleSearchCandidate,
  SearchableField,
} from '../../../common/search/application-search-provider.js';
import {
  normalizeSearchText,
  safeSearchSnippet,
} from '../../../common/search/search-normalization.js';

export interface RankedSearchCandidate {
  candidate: ModuleSearchCandidate;
  matchedField: SearchableField;
  score: number;
  snippet?: string;
}

@Injectable()
export class SearchRankingService {
  public rank(
    candidate: ModuleSearchCandidate,
    normalizedQuery: string,
    now = new Date(),
  ): RankedSearchCandidate | null {
    const title = normalizeSearchText(candidate.title);
    const matches = candidate.fields
      .map((field) => ({
        field,
        normalizedValue: normalizeSearchText(field.value),
      }))
      .filter(({ normalizedValue }) =>
        normalizedValue.includes(normalizedQuery),
      )
      .map(({ field, normalizedValue }) => ({
        field,
        score: this.fieldScore(
          field,
          normalizedValue,
          normalizedQuery,
          field.key === 'title',
        ),
      }))
      .sort((left, right) => right.score - left.score);

    const best = matches[0];
    if (!best) return null;

    const recencyBoost = this.recencyBoost(candidate.updatedAt, now);
    const exactTitle = title === normalizedQuery;
    const score = Math.min(1, exactTitle ? 1 : best.score + recencyBoost);

    return {
      candidate,
      matchedField: best.field,
      score: Number(score.toFixed(4)),
      ...(best.field.snippetAllowed
        ? { snippet: safeSearchSnippet(best.field.value) }
        : {}),
    };
  }

  private fieldScore(
    field: SearchableField,
    value: string,
    query: string,
    isTitle: boolean,
  ): number {
    if (isTitle && value === query) return 1;
    if (isTitle && value.startsWith(query)) return 0.94;
    if (isTitle && value.split(' ').some((word) => word.startsWith(query)))
      return 0.9;
    if (isTitle) return 0.84;
    if (value === query) return Math.min(0.82, field.weight + 0.08);
    if (value.startsWith(query)) return Math.min(0.8, field.weight + 0.05);
    if (value.split(' ').some((word) => word.startsWith(query)))
      return Math.min(0.78, field.weight + 0.03);
    return Math.min(0.75, field.weight);
  }

  private recencyBoost(updatedAt: Date | undefined, now: Date): number {
    if (!updatedAt) return 0;
    const ageDays = Math.max(
      0,
      (now.getTime() - updatedAt.getTime()) / (24 * 60 * 60 * 1_000),
    );
    return Math.max(0, 0.04 * (1 - ageDays / 365));
  }
}
