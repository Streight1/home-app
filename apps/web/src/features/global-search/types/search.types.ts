import type { WorkspaceView } from '../../../app/workspace-navigation/workspace-navigation.types.js';

export type SearchEntityType =
  | 'documents'
  | 'tasks'
  | 'maintenance'
  | 'calendar'
  | 'finance'
  | 'bucket-list'
  | 'recipes'
  | 'meal-plan'
  | 'shopping'
  | 'pantry'
  | 'trips'
  | 'gear'
  | 'pack-templates';

export type SearchFilterKey =
  | 'all'
  | 'documents'
  | 'tasks'
  | 'calendar'
  | 'finance'
  | 'meals'
  | 'expeditions'
  | 'other';

export interface ApplicationSearchResult {
  resultId: string;
  providerKey: string;
  entityKind: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  matchedField: string;
  iconKey: string;
  dateLabel?: string;
  badges?: { label: string; tone?: string }[];
  score: number;
  navigationTarget: unknown;
}

export interface ApplicationSearchResponse {
  groups: {
    key: string;
    label: string;
    total: number;
    items: ApplicationSearchResult[];
  }[];
  partial: boolean;
  unavailableProviders: string[];
}

export interface RecentSearchItem {
  providerKey: string;
  entityKind: string;
  title: string;
  navigationTarget: WorkspaceView;
  openedAt: string;
}

export const searchFilterTypes: Record<
  SearchFilterKey,
  readonly SearchEntityType[]
> = {
  all: [],
  documents: ['documents'],
  tasks: ['tasks', 'maintenance'],
  calendar: ['calendar'],
  finance: ['finance'],
  meals: ['recipes', 'meal-plan', 'shopping', 'pantry'],
  expeditions: ['trips', 'gear', 'pack-templates'],
  other: ['bucket-list'],
};
