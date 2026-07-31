import {
  dateOnlyToDatabase,
  serializeNullableDateOnly,
} from '../../../common/time/date-only.js';

export const BUCKET_LIST_READ_ROLE = 'VIEWER' as const;
export const BUCKET_LIST_WRITE_ROLE = 'MEMBER' as const;

export const BUCKET_LIST_CATEGORIES = [
  'TRAVEL',
  'EXPERIENCE',
  'SPORT',
  'RELATIONSHIP',
  'CULTURE',
  'LEARNING',
  'HOME',
  'FOOD',
  'NATURE',
  'PERSONAL',
  'OTHER',
] as const;

export const BUCKET_LIST_PRIORITIES = ['LOW', 'NORMAL', 'HIGH'] as const;
export const BUCKET_LIST_ITEM_STATUSES = [
  'PLANNED',
  'COMPLETED',
  'SKIPPED',
] as const;
export const BUCKET_LIST_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'CLOSED',
  'ARCHIVED',
] as const;

export type BucketListCategory = (typeof BUCKET_LIST_CATEGORIES)[number];
export type BucketListPriority = (typeof BUCKET_LIST_PRIORITIES)[number];
export type BucketListItemStatus = (typeof BUCKET_LIST_ITEM_STATUSES)[number];

export function dateOnly(value: string): Date {
  return dateOnlyToDatabase(value);
}

export function dateOnlyString(value: Date | null): string | null {
  return serializeNullableDateOnly(value);
}

export function bucketListProgress(input: {
  planned: number;
  completed: number;
  skipped: number;
}) {
  const total = input.planned + input.completed + input.skipped;
  return {
    ...input,
    total,
    percent: total === 0 ? 0 : Math.round((input.completed / total) * 100),
  };
}
