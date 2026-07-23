import type {
  BucketListCategory,
  BucketListItemStatus,
  BucketListPriority,
} from '../types/bucket-list.types.js';

export const bucketListCategoryLabels: Record<BucketListCategory, string> = {
  TRAVEL: 'Cestování',
  EXPERIENCE: 'Zážitek',
  SPORT: 'Sport',
  RELATIONSHIP: 'Vztahy',
  CULTURE: 'Kultura',
  LEARNING: 'Učení',
  HOME: 'Domov',
  FOOD: 'Jídlo',
  NATURE: 'Příroda',
  PERSONAL: 'Osobní',
  OTHER: 'Ostatní',
};

export const bucketListPriorityLabels: Record<BucketListPriority, string> = {
  LOW: 'Nízká',
  NORMAL: 'Běžná',
  HIGH: 'Vysoká',
};

export const bucketListStatusLabels: Record<BucketListItemStatus, string> = {
  PLANNED: 'Plánujeme',
  COMPLETED: 'Splněno',
  SKIPPED: 'Přeskočeno',
};

export function formatBucketDate(value: string | null) {
  if (!value) return null;
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}
