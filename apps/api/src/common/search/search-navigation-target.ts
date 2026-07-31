import type { SearchNavigationTarget } from './application-search-provider.js';

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSearchNavigationTarget(
  value: SearchNavigationTarget,
): boolean {
  if (value.area === 'documents') return uuid.test(value.documentId);
  if (value.area === 'tasks') return uuid.test(value.taskId);
  if (value.area === 'maintenance') return uuid.test(value.planId);
  if (value.area === 'calendar') return uuid.test(value.eventId);
  if (value.area === 'finance') return uuid.test(value.transactionId);
  if (value.area === 'bucket-list') return uuid.test(value.itemId);
  if (value.area === 'meals')
    return value.screen !== 'recipe' || uuid.test(value.recipeId);
  if (value.screen === 'trip') return uuid.test(value.tripId);
  if (value.screen === 'gear') return uuid.test(value.gearItemId);
  return uuid.test(value.templateId);
}
