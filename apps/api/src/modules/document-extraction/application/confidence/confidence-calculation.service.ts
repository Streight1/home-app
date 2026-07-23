import { Injectable } from '@nestjs/common';
import type { InvoiceCandidateDraft } from '../../domain/invoice-extraction.js';

@Injectable()
export class ConfidenceCalculationService {
  public calculate(candidate: InvoiceCandidateDraft): number {
    let confidence = 0.34;
    if (candidate.exactLabel) confidence += 0.3;
    else confidence += 0.14;
    if (candidate.validFormat) confidence += 0.16;
    if (candidate.profileMatch) confidence += 0.17;
    if (candidate.line.blocks.every((block) => block.confidence === null))
      confidence += 0.08;
    else if (
      candidate.line.blocks.some((block) => (block.confidence ?? 1) < 0.7)
    )
      confidence -= 0.18;
    if (candidate.conflictingValues) confidence -= 0.25;
    return Math.min(0.99, Math.max(0.05, confidence));
  }
}
