import { Injectable } from '@nestjs/common';
import type {
  InvoiceCandidateDraft,
  SupplierProfileMatch,
} from '../../domain/invoice-extraction.js';
import type {
  ExtractedPage,
  ExtractedValue,
} from '../../domain/extraction.types.js';
import { InvoiceNormalizationService } from '../normalization/invoice-normalizers.js';

type NormalizerKey =
  | 'TEXT'
  | 'DATE'
  | 'MONEY'
  | 'CURRENCY'
  | 'COMPANY_ID'
  | 'VAT_ID'
  | 'BANK_ACCOUNT'
  | 'IBAN'
  | 'VARIABLE_SYMBOL'
  | 'INVOICE_NUMBER';
interface Pattern {
  key: string;
  labels: readonly string[];
  normalizer: NormalizerKey;
}

const patterns: readonly Pattern[] = [
  {
    key: 'supplierName',
    labels: ['dodavatel', 'supplier', 'vystavil'],
    normalizer: 'TEXT',
  },
  {
    key: 'supplierCompanyId',
    labels: ['ičo', 'company id'],
    normalizer: 'COMPANY_ID',
  },
  { key: 'supplierVatId', labels: ['dič', 'vat id'], normalizer: 'VAT_ID' },
  {
    key: 'invoiceNumber',
    labels: ['číslo faktury', 'faktura č.', 'invoice number', 'invoice no.'],
    normalizer: 'INVOICE_NUMBER',
  },
  {
    key: 'variableSymbol',
    labels: ['variabilní symbol', 'variable symbol', 'var. symbol', 'vs'],
    normalizer: 'VARIABLE_SYMBOL',
  },
  {
    key: 'constantSymbol',
    labels: ['konstantní symbol', 'constant symbol', 'ks'],
    normalizer: 'VARIABLE_SYMBOL',
  },
  {
    key: 'orderNumber',
    labels: ['číslo objednávky', 'objednávka', 'order number', 'order no.'],
    normalizer: 'INVOICE_NUMBER',
  },
  {
    key: 'issueDate',
    labels: ['datum vystavení', 'vystaveno', 'issue date'],
    normalizer: 'DATE',
  },
  {
    key: 'taxableSupplyDate',
    labels: ['datum zdanitelného plnění', 'duzp', 'tax date'],
    normalizer: 'DATE',
  },
  {
    key: 'dueDate',
    labels: ['datum splatnosti', 'splatnost', 'due date'],
    normalizer: 'DATE',
  },
  {
    key: 'subtotalAmountMinor',
    labels: ['základ daně', 'bez dph', 'subtotal'],
    normalizer: 'MONEY',
  },
  {
    key: 'vatAmountMinor',
    labels: ['dph celkem', 'vat total', 'tax total'],
    normalizer: 'MONEY',
  },
  {
    key: 'totalAmountMinor',
    labels: [
      'celkem k úhradě',
      'částka k úhradě',
      'amount due',
      'total due',
      'celkem',
    ],
    normalizer: 'MONEY',
  },
  { key: 'currencyCode', labels: ['měna', 'currency'], normalizer: 'CURRENCY' },
  {
    key: 'supplierBankAccount',
    labels: ['číslo účtu', 'bankovní účet', 'bank account'],
    normalizer: 'BANK_ACCOUNT',
  },
  { key: 'supplierIban', labels: ['iban'], normalizer: 'IBAN' },
];

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class GenericInvoiceExtractorService {
  public constructor(
    private readonly normalization: InvoiceNormalizationService,
  ) {}

  public extract(
    pages: readonly ExtractedPage[],
    profile: SupplierProfileMatch | null,
  ): InvoiceCandidateDraft[] {
    const candidates: InvoiceCandidateDraft[] = [];
    for (const pattern of patterns)
      for (const page of pages)
        for (const line of page.lines) {
          for (const [labelIndex, label] of pattern.labels.entries()) {
            const match = new RegExp(
              `(?:^|\\b)${escaped(label)}\\s*(?:[:#-]|č\\.?)?\\s*(.+)$`,
              'i',
            ).exec(line.text);
            const rawValue = match?.[1]?.trim();
            if (!rawValue) continue;
            const normalizedValue = this.normalize(
              pattern.normalizer,
              rawValue,
            );
            if (normalizedValue === null) continue;
            candidates.push({
              fieldKey: pattern.key,
              rawValue,
              normalizedValue,
              line,
              exactLabel: labelIndex === 0,
              validFormat: pattern.normalizer !== 'TEXT',
              profileMatch: pattern.key === 'supplierName' && profile !== null,
              conflictingValues: false,
              confidenceReasons: [
                labelIndex === 0 ? 'EXACT_LABEL_MATCH' : 'NEAR_LABEL_MATCH',
                ...(pattern.normalizer !== 'TEXT'
                  ? ['VALID_FORMAT' as const]
                  : []),
              ],
            });
          }
        }
    if (
      profile &&
      !candidates.some((candidate) => candidate.fieldKey === 'supplierName')
    ) {
      const line = pages
        .flatMap((page) => page.lines)
        .find((candidate) => /alza\.cz/i.test(candidate.text));
      if (line)
        candidates.push({
          fieldKey: 'supplierName',
          rawValue: profile.supplierName,
          normalizedValue: profile.supplierName,
          line,
          exactLabel: false,
          validFormat: true,
          profileMatch: true,
          conflictingValues: false,
          confidenceReasons: ['SUPPLIER_PROFILE_MATCH', 'VALID_FORMAT'],
        });
    }
    return this.selectBest(candidates);
  }

  private selectBest(
    candidates: InvoiceCandidateDraft[],
  ): InvoiceCandidateDraft[] {
    const grouped = new Map<string, InvoiceCandidateDraft[]>();
    for (const candidate of candidates)
      grouped.set(candidate.fieldKey, [
        ...(grouped.get(candidate.fieldKey) ?? []),
        candidate,
      ]);
    return [...grouped.values()].map((items) => {
      const values = new Set(
        items.map((item) => JSON.stringify(item.normalizedValue)),
      );
      const ranked = [...items].sort((a, b) => {
        const priority = (candidate: InvoiceCandidateDraft) =>
          Number(candidate.exactLabel) * 4 +
          Number(candidate.profileMatch) * 3 +
          (candidate.fieldKey === 'totalAmountMinor' &&
          /k úhradě|amount due|total due/i.test(candidate.line.text)
            ? 5
            : 0);
        return priority(b) - priority(a);
      });
      const best = ranked.at(0);
      if (best === undefined)
        throw new Error('Invoice candidate group must not be empty.');
      return {
        ...best,
        conflictingValues: values.size > 1,
        confidenceReasons:
          values.size > 1
            ? [...best.confidenceReasons, 'MULTIPLE_CONFLICTING_VALUES']
            : best.confidenceReasons,
      };
    });
  }

  private normalize(type: NormalizerKey, value: string): ExtractedValue | null {
    if (type === 'DATE') return this.normalization.date.normalize(value);
    if (type === 'MONEY') return this.normalization.money.normalize(value);
    if (type === 'CURRENCY')
      return this.normalization.currency.normalize(value);
    if (type === 'COMPANY_ID')
      return this.normalization.companyId.normalize(value);
    if (type === 'VAT_ID') return this.normalization.vatId.normalize(value);
    if (type === 'BANK_ACCOUNT')
      return this.normalization.bankAccount.normalize(value);
    if (type === 'IBAN') return this.normalization.iban.normalize(value);
    if (type === 'VARIABLE_SYMBOL')
      return this.normalization.variableSymbol.normalize(value);
    if (type === 'INVOICE_NUMBER')
      return this.normalization.invoiceNumber.normalize(value);
    const normalized = value.trim().slice(0, 500);
    return normalized || null;
  }
}
