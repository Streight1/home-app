import type { HouseholdRole } from '../../modules/households/household.types.js';

export const SEARCH_ENTITY_TYPES = [
  'documents',
  'tasks',
  'maintenance',
  'calendar',
  'finance',
  'bucket-list',
  'recipes',
  'meal-plan',
  'shopping',
  'pantry',
  'trips',
  'gear',
  'pack-templates',
] as const;

export type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[number];

export type SearchProviderKey =
  | 'documents'
  | 'tasks'
  | 'maintenance'
  | 'calendar'
  | 'finance'
  | 'bucket-list'
  | 'meals'
  | 'expeditions';

export type SearchGroupKey =
  | 'documents'
  | 'tasks'
  | 'calendar'
  | 'finance'
  | 'meals'
  | 'expeditions'
  | 'other';

export type SearchNavigationTarget =
  | { area: 'documents'; screen: 'detail'; documentId: string }
  | { area: 'tasks'; screen: 'detail'; taskId: string }
  | { area: 'maintenance'; screen: 'plan'; planId: string }
  | { area: 'calendar'; screen: 'detail'; eventId: string }
  | { area: 'finance'; screen: 'detail'; transactionId: string }
  | { area: 'bucket-list'; screen: 'item'; itemId: string }
  | { area: 'meals'; screen: 'recipe'; recipeId: string }
  | { area: 'meals'; screen: 'planner' | 'shopping' | 'pantry' }
  | { area: 'expeditions'; screen: 'trip'; tripId: string }
  | { area: 'expeditions'; screen: 'gear'; gearItemId: string }
  | { area: 'expeditions'; screen: 'templates'; templateId: string };

export interface SearchContext {
  userId: string;
  householdId: string;
  role: HouseholdRole;
}

export interface ModuleSearchRequest {
  normalizedQuery: string;
  requestedTypes: ReadonlySet<SearchEntityType>;
  limitPerType: number;
}

export interface SearchableField {
  key: string;
  label: string;
  value: string;
  weight: number;
  snippetAllowed?: boolean;
}

export interface ModuleSearchCandidate {
  providerKey: SearchProviderKey;
  entityId: string;
  entityKind: string;
  entityType: SearchEntityType;
  groupKey: SearchGroupKey;
  title: string;
  subtitle?: string;
  iconKey: string;
  dateLabel?: string;
  badges?: { label: string; tone?: 'neutral' | 'info' | 'warning' }[];
  fields: SearchableField[];
  navigationTarget: SearchNavigationTarget;
  updatedAt?: Date;
}

export interface ApplicationSearchProvider {
  readonly providerKey: SearchProviderKey;
  readonly supportedTypes: readonly SearchEntityType[];
  search(
    context: SearchContext,
    request: ModuleSearchRequest,
  ): Promise<ModuleSearchCandidate[]>;
}

export function searchField(
  key: string,
  label: string,
  value: string | null | undefined,
  weight: number,
  snippetAllowed = false,
): SearchableField | null {
  const normalized = value?.trim();
  return normalized
    ? { key, label, value: normalized, weight, snippetAllowed }
    : null;
}

export function compactSearchFields(
  fields: (SearchableField | null)[],
): SearchableField[] {
  return fields.filter((field): field is SearchableField => field !== null);
}

export function escapeSearchLike(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('%', '\\%')
    .replaceAll('_', '\\_');
}

export function searchLikePattern(normalizedQuery: string): string {
  return `%${escapeSearchLike(normalizedQuery)}%`;
}
