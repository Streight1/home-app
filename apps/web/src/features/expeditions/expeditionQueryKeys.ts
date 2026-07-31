export const expeditionKeys = {
  all: ['expeditions'] as const,
  gear: () => [...expeditionKeys.all, 'gear'] as const,
  gearList: (filters: unknown) => [...expeditionKeys.gear(), filters] as const,
  categories: () => [...expeditionKeys.all, 'categories'] as const,
  templates: () => [...expeditionKeys.all, 'templates'] as const,
  trips: () => [...expeditionKeys.all, 'trips'] as const,
  trip: (tripId: string | undefined) =>
    [...expeditionKeys.all, 'trip', tripId] as const,
  weight: (tripId: string | undefined) =>
    [...expeditionKeys.all, 'weight', tripId] as const,
  templateReview: (tripId: string) =>
    [...expeditionKeys.all, 'template-review', tripId] as const,
  dashboard: () => [...expeditionKeys.all, 'dashboard'] as const,
};

export const EXPEDITIONS_QUERY_KEY = expeditionKeys.all;
