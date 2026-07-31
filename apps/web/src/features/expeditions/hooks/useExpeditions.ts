import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { TASKS_QUERY_KEY } from '../../tasks/tasks-query.public.js';
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
import { expeditionKeys } from '../expeditionQueryKeys.js';

export { EXPEDITIONS_QUERY_KEY } from '../expeditionQueryKeys.js';

export const useGear = (filters = { page: 1, pageSize: 20 }) =>
  useQuery({
    queryKey: expeditionKeys.gearList(filters),
    queryFn: () => getGear(filters),
    placeholderData: keepPreviousData,
  });
export const useGearCategories = () =>
  useQuery({
    queryKey: expeditionKeys.categories(),
    queryFn: getGearCategories,
  });
export const usePackTemplates = () =>
  useQuery({
    queryKey: expeditionKeys.templates(),
    queryFn: getPackTemplates,
  });
export const useTrips = () =>
  useQuery({
    queryKey: expeditionKeys.trips(),
    queryFn: getTrips,
  });
export const useTrip = (tripId?: string) =>
  useQuery({
    queryKey: expeditionKeys.trip(tripId),
    queryFn: () => {
      if (!tripId) throw new Error('Chybí výprava.');
      return getTrip(tripId);
    },
    enabled: Boolean(tripId),
  });
export const useTripWeightSummary = (tripId?: string) =>
  useQuery({
    queryKey: expeditionKeys.weight(tripId),
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
    queryKey: expeditionKeys.templateReview(tripId),
    queryFn: () => getTripTemplateReviewPreview(tripId),
    enabled,
  });
export const useExpeditionsDashboard = () =>
  useQuery({
    queryKey: expeditionKeys.dashboard(),
    queryFn: getExpeditionsDashboard,
  });

export function useExpeditionMutations() {
  const client = useQueryClient();
  const invalidate = (...queryKeys: readonly (readonly unknown[])[]) =>
    Promise.all(
      queryKeys.map((queryKey) => client.invalidateQueries({ queryKey })),
    );
  const refreshTrip = (tripId: string) =>
    invalidate(
      expeditionKeys.trip(tripId),
      expeditionKeys.trips(),
      expeditionKeys.weight(tripId),
      expeditionKeys.dashboard(),
    );
  return {
    createGear: useMutation({
      mutationFn: createGear,
      onSuccess: () => invalidate(expeditionKeys.gear()),
    }),
    recommendedCategories: useMutation({
      mutationFn: createRecommendedGearCategories,
      onSuccess: () => invalidate(expeditionKeys.categories()),
    }),
    importImage: useMutation({
      mutationFn: ({
        gearItemId,
        input,
      }: {
        gearItemId: string;
        input: Parameters<typeof importGearImage>[1];
      }) => importGearImage(gearItemId, input),
      onSuccess: () => invalidate(expeditionKeys.gear()),
    }),
    searchImages: useMutation({ mutationFn: searchGearImages }),
    createTemplate: useMutation({
      mutationFn: createPackTemplate,
      onSuccess: () => invalidate(expeditionKeys.templates()),
    }),
    createTrip: useMutation({
      mutationFn: createTrip,
      onSuccess: () =>
        invalidate(expeditionKeys.trips(), expeditionKeys.dashboard()),
    }),
    replaceItems: useMutation({
      mutationFn: ({
        tripId,
        items,
      }: {
        tripId: string;
        items: TripPackItemInput[];
      }) => replaceTripPackItems(tripId, items),
      onSuccess: (_trip, { tripId }) => refreshTrip(tripId),
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
        const queryKey = expeditionKeys.trip(tripId);
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
      onSettled: (_data, _error, { tripId }) => refreshTrip(tripId),
    }),
    markReady: useMutation({
      mutationFn: markTripReady,
      onSuccess: (_trip, tripId) => refreshTrip(tripId),
    }),
    complete: useMutation({
      mutationFn: completeTrip,
      onSuccess: (_trip, tripId) => refreshTrip(tripId),
    }),
    review: useMutation({
      mutationFn: ({
        tripId,
        items,
      }: {
        tripId: string;
        items: Parameters<typeof reviewTrip>[1];
      }) => reviewTrip(tripId, items),
      onSuccess: (_trip, { tripId }) =>
        Promise.all([
          refreshTrip(tripId),
          invalidate(expeditionKeys.templateReview(tripId)),
        ]),
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
      onSuccess: (_template, { tripId }) =>
        invalidate(
          expeditionKeys.templates(),
          expeditionKeys.templateReview(tripId),
        ),
    }),
    createTask: useMutation({
      mutationFn: ({
        tripId,
        input,
      }: {
        tripId: string;
        input: Parameters<typeof createTripTask>[1];
      }) => createTripTask(tripId, input),
      onSuccess: () => client.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
    }),
  };
}
