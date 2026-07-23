import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  BucketList,
  BucketListDashboard,
  BucketListFilters,
  BucketListItem,
  BucketListItemInput,
  BucketListStatus,
} from '../types/bucket-list.types.js';

export const getBucketLists = (year?: number) =>
  apiRequest<{ items: BucketList[] }>(
    `/bucket-lists${year ? `?year=${String(year)}` : ''}`,
  );

export const createBucketList = (input: {
  year: number;
  title?: string;
  description?: string;
  status?: Extract<BucketListStatus, 'DRAFT' | 'ACTIVE'>;
}) =>
  apiRequest<BucketList>('/bucket-lists', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const getBucketListItems = (
  listId: string,
  filters: BucketListFilters,
) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters) as [
    string,
    string | undefined,
  ][])
    if (value !== undefined && value !== '') query.set(key, value);
  const suffix = query.size ? `?${query.toString()}` : '';
  return apiRequest<{ items: BucketListItem[] }>(
    `/bucket-lists/${listId}/items${suffix}`,
  );
};

export const getBucketListItem = (itemId: string) =>
  apiRequest<BucketListItem>(`/bucket-list-items/${itemId}`);

export const createBucketListItem = (
  listId: string,
  input: BucketListItemInput,
) =>
  apiRequest<BucketListItem>(`/bucket-lists/${listId}/items`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateBucketListItem = (
  itemId: string,
  input: Partial<BucketListItemInput>,
) =>
  apiRequest<BucketListItem>(`/bucket-list-items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const deleteBucketListItem = (itemId: string) =>
  apiRequest<{ id: string }>(`/bucket-list-items/${itemId}`, {
    method: 'DELETE',
  });

export const bucketListItemAction = (
  itemId: string,
  action: 'complete' | 'reopen' | 'skip' | 'restore',
  input?: { completedDate?: string; note?: string; reason?: string },
) =>
  apiRequest<BucketListItem>(`/bucket-list-items/${itemId}/${action}`, {
    method: 'POST',
    ...(input ? { body: JSON.stringify(input) } : {}),
  });

export const getBucketListDashboard = () =>
  apiRequest<BucketListDashboard>('/bucket-lists/dashboard');

export const prepareBucketListRollover = (listId: string, targetYear: number) =>
  apiRequest<{
    source: { id: string; year: number; title: string };
    target: { id: string; year: number; title: string } | null;
    candidates: {
      id: string;
      title: string;
      status: 'PLANNED' | 'SKIPPED';
      category: string;
      priority: string;
      targetDate: string | null;
      participantCount: number;
      documentCount: number;
    }[];
  }>(`/bucket-lists/${listId}/rollover/prepare`, {
    method: 'POST',
    body: JSON.stringify({ targetYear }),
  });

export const carryBucketListItems = (
  listId: string,
  input: {
    targetYear: number;
    itemIds: string[];
    carryDocuments: boolean;
    carryTargetDate: boolean;
  },
) =>
  apiRequest<{ targetListId: string; carriedItemCount: number }>(
    `/bucket-lists/${listId}/rollover/carry`,
    { method: 'POST', body: JSON.stringify(input) },
  );
