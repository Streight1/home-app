export const MEALS_READ_ROLE = 'VIEWER' as const;
export const MEALS_WRITE_ROLE = 'MEMBER' as const;
export const MEALS_ADMIN_ROLE = 'ADMIN' as const;

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DECIMAL_QUANTITY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/;

export const normalizeCatalogName = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('cs-CZ');

export const optionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? null : trimmed;
};

export const dateOnly = (value: string) => new Date(`${value}T12:00:00.000Z`);

export const dateOnlyString = (value: Date) => value.toISOString().slice(0, 10);

export const currentDateOnly = (now = new Date(), timeZone = 'Europe/Prague') =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

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
