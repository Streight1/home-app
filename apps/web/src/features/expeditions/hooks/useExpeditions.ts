import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createGear,
  createPackTemplate,
  createRecommendedGearCategories,
  createTrip,
  completeTrip,
  createTripTask,
  applyTripReviewToTemplate,
  getExpeditionsDashboard,
  getGear,
  getGearCategories,
  getPackTemplates,
  getTrip,
  getTripTemplateReviewPreview,
  getTrips,
  getTripWeightSummary,
  importGearImage,
  markTripReady,
  reviewTrip,
  replaceTripPackItems,
  searchGearImages,
  updatePackingStatus,
} from '../api/expeditionsApi.js';
import type {
  PackingStatus,
  Trip,
  TripPackItemInput,
} from '../types/expeditions.types.js';

export const EXPEDITIONS_QUERY_KEY = ['expeditions'] as const;

export const useGear = (filters = { page: 1, pageSize: 20 }) =>
  useQuery({
    queryKey: [...EXPEDITIONS_QUERY_KEY, 'gear', filters],
    queryFn: () => getGear(filters),
    placeholderData: keepPreviousData,
  });
export const useGearCategories = () =>
  useQuery({
    queryKey: [...EXPEDITIONS_QUERY_KEY, 'categories'],
    queryFn: getGearCategories,
  });
export const usePackTemplates = () =>
  useQuery({
    queryKey: [...EXPEDITIONS_QUERY_KEY, 'templates'],
    queryFn: getPackTemplates,
  });
export const useTrips = () =>
  useQuery({
    queryKey: [...EXPEDITIONS_QUERY_KEY, 'trips'],
    queryFn: getTrips,
  });
export const useTrip = (tripId?: string) =>
  useQuery({
    queryKey: [...EXPEDITIONS_QUERY_KEY, 'trip', tripId],
    queryFn: () => {
      if (!tripId) throw new Error('Chybí výprava.');
      return getTrip(tripId);
    },
    enabled: Boolean(tripId),
  });
export const useTripWeightSummary = (tripId?: string) =>
  useQuery({
    queryKey: [...EXPEDITIONS_QUERY_KEY, 'weight', tripId],
    queryFn: () => {
      if (!tripId) throw new Error('Chybí výprava.');
      return getTripWeightSummary(tripId);
    },
    enabled: Boolean(tripId),
  });
export const useTripTemplateReviewPreview = (
  tripId: string,
  enabled: boolean,
) =>
  useQuery({
    queryKey: [...EXPEDITIONS_QUERY_KEY, 'template-review', tripId],
    queryFn: () => getTripTemplateReviewPreview(tripId),
    enabled,
  });
export const useExpeditionsDashboard = () =>
  useQuery({
    queryKey: [...EXPEDITIONS_QUERY_KEY, 'dashboard'],
    queryFn: getExpeditionsDashboard,
  });

export function useExpeditionMutations() {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: EXPEDITIONS_QUERY_KEY });
  return {
    createGear: useMutation({ mutationFn: createGear, onSuccess: refresh }),
    recommendedCategories: useMutation({
      mutationFn: createRecommendedGearCategories,
      onSuccess: refresh,
    }),
    importImage: useMutation({
      mutationFn: ({
        gearItemId,
        input,
      }: {
        gearItemId: string;
        input: Parameters<typeof importGearImage>[1];
      }) => importGearImage(gearItemId, input),
      onSuccess: refresh,
    }),
    searchImages: useMutation({ mutationFn: searchGearImages }),
    createTemplate: useMutation({
      mutationFn: createPackTemplate,
      onSuccess: refresh,
    }),
    createTrip: useMutation({ mutationFn: createTrip, onSuccess: refresh }),
    replaceItems: useMutation({
      mutationFn: ({
        tripId,
        items,
      }: {
        tripId: string;
        items: TripPackItemInput[];
      }) => replaceTripPackItems(tripId, items),
      onSuccess: refresh,
    }),
    packing: useMutation({
      mutationFn: ({
        tripId,
        itemIds,
        status,
      }: {
        tripId: string;
        itemIds: string[];
        status: PackingStatus;
      }) => updatePackingStatus(tripId, itemIds, status),
      onMutate: async ({ tripId, itemIds, status }) => {
        const queryKey = [...EXPEDITIONS_QUERY_KEY, 'trip', tripId];
        await client.cancelQueries({ queryKey });
        const previous = client.getQueryData<Trip>(queryKey);
        client.setQueryData<Trip>(queryKey, (current) =>
          current
            ? {
                ...current,
                items: current.items.map((item) =>
                  itemIds.includes(item.id)
                    ? {
                        ...item,
                        packingStatus: status,
                        packedAt:
                          status === 'PACKED' ? new Date().toISOString() : null,
                      }
                    : item,
                ),
              }
            : current,
        );
        return { previous, queryKey };
      },
      onError: (_error, _variables, context) => {
        if (context?.previous)
          client.setQueryData(context.queryKey, context.previous);
      },
      onSettled: refresh,
    }),
    markReady: useMutation({
      mutationFn: markTripReady,
      onSuccess: refresh,
    }),
    complete: useMutation({
      mutationFn: completeTrip,
      onSuccess: refresh,
    }),
    review: useMutation({
      mutationFn: ({
        tripId,
        items,
      }: {
        tripId: string;
        items: Parameters<typeof reviewTrip>[1];
      }) => reviewTrip(tripId, items),
      onSuccess: refresh,
    }),
    applyTemplateReview: useMutation({
      mutationFn: ({
        tripId,
        removeTripItemIds,
        addTripItemIds,
      }: {
        tripId: string;
        removeTripItemIds: string[];
        addTripItemIds: string[];
      }) =>
        applyTripReviewToTemplate(tripId, {
          removeTripItemIds,
          addTripItemIds,
          confirmed: true,
        }),
      onSuccess: refresh,
    }),
    createTask: useMutation({
      mutationFn: ({
        tripId,
        input,
      }: {
        tripId: string;
        input: Parameters<typeof createTripTask>[1];
      }) => createTripTask(tripId, input),
    }),
  };
}
