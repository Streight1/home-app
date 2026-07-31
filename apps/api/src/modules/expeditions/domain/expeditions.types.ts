import { DECIMAL_QUANTITY_PATTERN } from '../../../common/numbers/decimal.js';
import {
  currentDateOnlyInTimeZone,
  DATE_ONLY_PATTERN,
  dateOnlyToDatabase,
  serializeDateOnly,
} from '../../../common/time/date-only.js';

export const EXPEDITIONS_READ_ROLE = 'VIEWER' as const;
export const EXPEDITIONS_WRITE_ROLE = 'MEMBER' as const;
export const EXPEDITIONS_ADMIN_ROLE = 'ADMIN' as const;

export { DATE_ONLY_PATTERN, DECIMAL_QUANTITY_PATTERN };

export const normalizeGearName = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('cs-CZ');

export const optionalText = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
};

export const dateOnly = dateOnlyToDatabase;
export const dateOnlyString = serializeDateOnly;
export const currentDateOnly = (now = new Date(), timeZone = 'Europe/Prague') =>
  currentDateOnlyInTimeZone(now, timeZone);

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
