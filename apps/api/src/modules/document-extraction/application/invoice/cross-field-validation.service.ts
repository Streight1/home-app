import { Injectable } from '@nestjs/common';
import type { ExtractedFieldCandidate } from '../../domain/extraction.types.js';

function numeric(
  candidates: readonly ExtractedFieldCandidate[],
  key: string,
): number | null {
  const value = candidates.find(
    (candidate) => candidate.fieldKey === key,
  )?.normalizedValue;
  return typeof value === 'number' ? value : null;
}
function date(
  candidates: readonly ExtractedFieldCandidate[],
  key: string,
): string | null {
  const value = candidates.find(
    (candidate) => candidate.fieldKey === key,
  )?.normalizedValue;
  return typeof value === 'string' ? value : null;
}

@Injectable()
export class CrossFieldValidationService {
  public validate(
    candidates: readonly ExtractedFieldCandidate[],
  ): ExtractedFieldCandidate[] {
    const subtotal = numeric(candidates, 'subtotalAmountMinor');
    const vat = numeric(candidates, 'vatAmountMinor');
    const total = numeric(candidates, 'totalAmountMinor');
    const totalsConsistent =
      subtotal === null ||
      vat === null ||
      total === null ||
      Math.abs(subtotal + vat - total) <= 2;
    const issueDate = date(candidates, 'issueDate');
    const dueDate = date(candidates, 'dueDate');
    const datesConsistent = !issueDate || !dueDate || dueDate >= issueDate;
    return candidates.map((candidate) => {
      if (
        !totalsConsistent &&
        ['subtotalAmountMinor', 'vatAmountMinor', 'totalAmountMinor'].includes(
          candidate.fieldKey,
        )
      )
        return {
          ...candidate,
          confidence: Math.max(0.05, candidate.confidence - 0.25),
          confidenceReasons: [
            ...candidate.confidenceReasons,
            'TOTALS_INCONSISTENT',
          ],
        };
      if (
        totalsConsistent &&
        subtotal !== null &&
        vat !== null &&
        total !== null &&
        ['subtotalAmountMinor', 'vatAmountMinor', 'totalAmountMinor'].includes(
          candidate.fieldKey,
        )
      )
        return {
          ...candidate,
          confidence: Math.min(0.99, candidate.confidence + 0.05),
          confidenceReasons: [
            ...candidate.confidenceReasons,
            'CROSS_FIELD_CONSISTENT',
          ],
        };
      if (
        !datesConsistent &&
        ['issueDate', 'dueDate'].includes(candidate.fieldKey)
      )
        return {
          ...candidate,
          confidence: Math.max(0.05, candidate.confidence - 0.25),
          confidenceReasons: [
            ...candidate.confidenceReasons,
            'DATE_SEQUENCE_INCONSISTENT',
          ],
        };
      return candidate;
    });
  }
}
