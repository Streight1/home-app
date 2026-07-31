import { DECIMAL_QUANTITY_PATTERN } from '../../../common/numbers/decimal.js';
import {
  currentDateOnlyInTimeZone,
  DATE_ONLY_PATTERN,
  dateOnlyToDatabase,
  serializeDateOnly,
} from '../../../common/time/date-only.js';

export const MEALS_READ_ROLE = 'VIEWER' as const;
export const MEALS_WRITE_ROLE = 'MEMBER' as const;
export const MEALS_ADMIN_ROLE = 'ADMIN' as const;

export { DATE_ONLY_PATTERN, DECIMAL_QUANTITY_PATTERN };

export const normalizeCatalogName = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('cs-CZ');

export const optionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? null : trimmed;
};

export const dateOnly = dateOnlyToDatabase;

export const dateOnlyString = serializeDateOnly;

export const currentDateOnly = (now = new Date(), timeZone = 'Europe/Prague') =>
  currentDateOnlyInTimeZone(now, timeZone);

export const RECIPE_DIFFICULTIES = [
  'EASY',
  'MEDIUM',
  'ADVANCED',
  'UNSPECIFIED',
] as const;

export const INGREDIENT_UNITS = [
  'G',
  'KG',
  'ML',
  'L',
  'TSP',
  'TBSP',
  'CUP',
  'PIECE',
  'PACKAGE',
  'SLICE',
  'PINCH',
  'AS_NEEDED',
  'CUSTOM',
] as const;

export const MEAL_TYPES = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
  'OTHER',
] as const;

export const PANTRY_STATUSES = ['AVAILABLE', 'LOW', 'OUT', 'UNKNOWN'] as const;
