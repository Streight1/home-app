import { Injectable } from '@nestjs/common';
import type { DocumentTypeKey } from '../../../documents/domain/metadata/document-type.js';
import type { ExtractedPage } from '../../domain/extraction.types.js';

@Injectable()
export class DocumentClassificationService {
  public classify(
    declaredType: DocumentTypeKey,
    pages: readonly ExtractedPage[],
  ): 'INVOICE' | 'RECEIPT' | 'UNKNOWN' {
    if (declaredType === 'INVOICE' || declaredType === 'RECEIPT')
      return declaredType;
    const text = pages
      .map((page) => page.text)
      .join('\n')
      .toLowerCase();
    if (/faktura|invoice|daňový doklad/.test(text)) return 'INVOICE';
    if (/účtenka|receipt|pokladní doklad/.test(text)) return 'RECEIPT';
    return 'UNKNOWN';
  }
}
