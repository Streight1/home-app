export interface FixedDecimalValue {
  toFixed(decimalPlaces: number): string;
}

export const DECIMAL_QUANTITY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/;

function trimDecimal(value: string): string {
  return value.includes('.')
    ? value.replace(/0+$/, '').replace(/\.$/, '')
    : value;
}

export function serializeDecimal(
  value: FixedDecimalValue,
  decimalPlaces?: number,
): string;
export function serializeDecimal(value: null, decimalPlaces?: number): null;
export function serializeDecimal(
  value: FixedDecimalValue | null,
  decimalPlaces?: number,
): string | null;
export function serializeDecimal(
  value: FixedDecimalValue | null,
  decimalPlaces = 3,
): string | null {
  return value === null ? null : trimDecimal(value.toFixed(decimalPlaces));
}
