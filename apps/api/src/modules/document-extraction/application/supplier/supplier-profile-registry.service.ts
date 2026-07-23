import { Injectable } from '@nestjs/common';
import type { SupplierProfileMatch } from '../../domain/invoice-extraction.js';
import type { ExtractedPage } from '../../domain/extraction.types.js';

interface SupplierProfile {
  key: string;
  version: string;
  supplierName: string;
  markers: readonly RegExp[];
}

const profiles: readonly SupplierProfile[] = [
  {
    key: 'alza-cz-layout',
    version: '1.0.0',
    supplierName: 'Alza.cz',
    markers: [/\balza\.cz\b/i, /www\.alza\.cz/i, /alza\.cz\s+a\.s\./i],
  },
];

@Injectable()
export class SupplierProfileRegistryService {
  public detect(pages: readonly ExtractedPage[]): SupplierProfileMatch | null {
    const text = pages.map((page) => page.text).join('\n');
    for (const profile of profiles) {
      const matches = profile.markers.filter((marker) =>
        marker.test(text),
      ).length;
      if (matches >= 2 || profile.markers[2]?.test(text))
        return {
          key: profile.key,
          version: profile.version,
          supplierName: profile.supplierName,
          confidence: Math.min(0.98, 0.78 + matches * 0.07),
        };
    }
    return null;
  }
}
