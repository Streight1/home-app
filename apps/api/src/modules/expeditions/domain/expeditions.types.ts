export const EXPEDITIONS_READ_ROLE = 'VIEWER' as const;
export const EXPEDITIONS_WRITE_ROLE = 'MEMBER' as const;
export const EXPEDITIONS_ADMIN_ROLE = 'ADMIN' as const;

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DECIMAL_QUANTITY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/;

export const normalizeGearName = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('cs-CZ');

export const optionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
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

export const GEAR_LOAD_TYPES = ['CARRIED', 'WORN', 'CONSUMABLE'] as const;
export const GEAR_CRITICALITIES = [
  'REQUIRED',
  'RECOMMENDED',
  'OPTIONAL',
] as const;
export const GEAR_WEIGHT_STATUSES = [
  'VERIFIED',
  'ESTIMATED',
  'UNKNOWN',
] as const;
export const GEAR_PACKING_STATUSES = [
  'PLANNED',
  'PACKED',
  'MISSING',
  'EXCLUDED',
] as const;
export const GEAR_REVIEW_OUTCOMES = [
  'USED',
  'UNUSED',
  'MISSING_DURING_TRIP',
  'BROKEN',
  'NOT_REVIEWED',
] as const;
export const EXPEDITION_TRIP_TYPES = [
  'DAY_HIKE',
  'OVERNIGHT',
  'MULTI_DAY_TREK',
  'HUT_TO_HUT',
  'CAMPING',
  'OTHER',
] as const;
