const confidenceReasonLabels: Readonly<Record<string, string>> = {
  EXACT_LABEL_MATCH: 'jednoznačný popisek u hodnoty',
  LABEL_PROXIMITY: 'hodnota je blízko odpovídajícího popisku',
  SUPPLIER_PROFILE_MATCH: 'shoda s ověřeným profilem dodavatele',
  VALID_FORMAT: 'platný formát hodnoty',
  VALID_CHECKSUM: 'platný kontrolní součet',
  CROSS_FIELD_CONSISTENT: 'souvisí konzistentně s ostatními údaji',
  MULTIPLE_CONFLICTING_VALUES: 'v dokumentu jsou konfliktní hodnoty',
  TOTALS_INCONSISTENT: 'součet částek není konzistentní',
  DATE_ORDER_INCONSISTENT: 'pořadí dat vyžaduje kontrolu',
  OCR_LOW_CONFIDENCE: 'nízká kvalita rozpoznání obrazu',
  LINE_ITEM_DERIVED: 'odvozeno z položek faktury',
};

export function confidenceReasonLabel(reason: string): string {
  return confidenceReasonLabels[reason] ?? 'další podpůrný signál';
}
