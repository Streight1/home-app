import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  ExpeditionsDashboard,
  GearCategory,
  GearInput,
  GearItem,
  PackTemplate,
  PackingStatus,
  Trip,
  TripInput,
  TripPackItemInput,
  TripTemplateReviewPreview,
  TripWeightSummary,
} from '../types/expeditions.types.js';

const query = (
  input: Record<string, string | number | boolean | undefined>,
) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input))
    if (value !== undefined && value !== '') params.set(key, String(value));
  return params.toString();
};

export const getGear = (filters: {
  query?: string;
  categoryId?: string;
  archived?: boolean;
  page?: number;
  pageSize?: number;
}) =>
  apiRequest<{
    items: GearItem[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }>(`/gear?${query(filters)}`);
export const createGear = (input: GearInput) =>
  apiRequest<GearItem>('/gear', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const getGearCategories = () =>
  apiRequest<GearCategory[]>('/gear-categories');
export const createRecommendedGearCategories = () =>
  apiRequest<{ createdCount: number }>('/gear-categories/recommended', {
    method: 'POST',
  });
export const importGearImage = (
  gearItemId: string,
  input: { imageUrl: string; attribution?: string; setAsCover: boolean },
) =>
  apiRequest<GearItem>(`/gear/${gearItemId}/image-from-url`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const searchGearImages = (imageQuery: string) =>
  apiRequest<{
    configured: boolean;
    results: {
      id: string;
      previewUrl: string;
      imageUrl: string;
      sourcePageUrl: string;
      attribution: string | null;
    }[];
    fallback: string[];
  }>('/gear/image-search', {
    method: 'POST',
    body: JSON.stringify({ query: imageQuery }),
  });

export const getPackTemplates = () =>
  apiRequest<PackTemplate[]>('/pack-templates');
export const createPackTemplate = (input: {
  name: string;
  description?: string;
  tripType: string;
  seasonLabel?: string;
  targetBaseWeightGrams?: number | null;
  defaultParticipantCount: number;
  items: {
    gearItemId?: string | null;
    customName?: string;
    categoryId?: string | null;
    quantity: string;
    unitWeightGrams: number;
    loadType: string;
    criticality: string;
    isShared: boolean;
    defaultAssignedUserId?: string | null;
  }[];
}) =>
  apiRequest<PackTemplate>('/pack-templates', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const getTrips = () => apiRequest<Trip[]>('/trips');
export const getTrip = (tripId: string) => apiRequest<Trip>(`/trips/${tripId}`);
export const createTrip = (input: TripInput) =>
  apiRequest<Trip>('/trips', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const updatePackingStatus = (
  tripId: string,
  itemIds: string[],
  status: PackingStatus,
) =>
  apiRequest<Trip>(`/trips/${tripId}/packing-status`, {
    method: 'POST',
    body: JSON.stringify({ itemIds, status }),
  });
export const replaceTripPackItems = (
  tripId: string,
  items: TripPackItemInput[],
) =>
  apiRequest<Trip>(`/trips/${tripId}/pack-items`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
export const getTripWeightSummary = (tripId: string) =>
  apiRequest<TripWeightSummary>(`/trips/${tripId}/weight-summary`);
export const markTripReady = (tripId: string) =>
  apiRequest<Trip>(`/trips/${tripId}/ready`, { method: 'POST' });
export const completeTrip = (tripId: string) =>
  apiRequest<Trip>(`/trips/${tripId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ confirmed: true }),
  });
export const reviewTrip = (
  tripId: string,
  items: { itemId: string; outcome: string; notes?: string }[],
) =>
  apiRequest<Trip>(`/trips/${tripId}/review`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
export const getTripTemplateReviewPreview = (tripId: string) =>
  apiRequest<TripTemplateReviewPreview>(
    `/trips/${tripId}/template-review-preview`,
  );
export const applyTripReviewToTemplate = (
  tripId: string,
  input: {
    removeTripItemIds: string[];
    addTripItemIds: string[];
    confirmed: boolean;
  },
) =>
  apiRequest<PackTemplate>(`/trips/${tripId}/template-review`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const createTripTask = (
  tripId: string,
  input: { itemId?: string; title: string },
) =>
  apiRequest<{ taskId: string }>(`/trips/${tripId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const getExpeditionsDashboard = () =>
  apiRequest<ExpeditionsDashboard>('/trips/dashboard');
