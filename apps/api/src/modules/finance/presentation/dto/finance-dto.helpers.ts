export const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const nullableText = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() === '' ? null : trim({ value });

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const MINOR_UNITS_PATTERN = /^-?\d+$/;
