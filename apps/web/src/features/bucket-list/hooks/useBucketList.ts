import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bucketListItemAction,
  carryBucketListItems,
  createBucketList,
  createBucketListItem,
  deleteBucketListItem,
  getBucketListDashboard,
  getBucketListItem,
  getBucketListItems,
  getBucketLists,
  prepareBucketListRollover,
  updateBucketListItem,
} from '../api/bucketListApi.js';
import type {
  BucketListFilters,
  BucketListItemInput,
} from '../types/bucket-list.types.js';

export const BUCKET_LIST_QUERY_KEY = ['bucket-list'] as const;

export const useBucketLists = (year?: number) =>
  useQuery({
    queryKey: [...BUCKET_LIST_QUERY_KEY, 'lists', year],
    queryFn: () => getBucketLists(year),
  });

export const useBucketListItems = (
  listId: string | null,
  filters: BucketListFilters,
) =>
  useQuery({
    queryKey: [...BUCKET_LIST_QUERY_KEY, 'items', listId, filters],
    queryFn: () => {
      if (!listId) throw new Error('Chybí roční seznam.');
      return getBucketListItems(listId, filters);
    },
    enabled: Boolean(listId),
  });

export const useBucketListItem = (itemId: string) =>
  useQuery({
    queryKey: [...BUCKET_LIST_QUERY_KEY, 'item', itemId],
    queryFn: () => getBucketListItem(itemId),
  });

export const useBucketListDashboard = () =>
  useQuery({
    queryKey: [...BUCKET_LIST_QUERY_KEY, 'dashboard'],
    queryFn: getBucketListDashboard,
  });

export function useBucketListMutations() {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: BUCKET_LIST_QUERY_KEY });
  return {
    createList: useMutation({
      mutationFn: createBucketList,
      onSuccess: refresh,
    }),
    createItem: useMutation({
      mutationFn: ({
        listId,
        input,
      }: {
        listId: string;
        input: BucketListItemInput;
      }) => createBucketListItem(listId, input),
      onSuccess: refresh,
    }),
    updateItem: useMutation({
      mutationFn: ({
        itemId,
        input,
      }: {
        itemId: string;
        input: Partial<BucketListItemInput>;
      }) => updateBucketListItem(itemId, input),
      onSuccess: refresh,
    }),
    deleteItem: useMutation({
      mutationFn: deleteBucketListItem,
      onSuccess: refresh,
    }),
    lifecycle: useMutation({
      mutationFn: ({
        itemId,
        action,
        input,
      }: {
        itemId: string;
        action: 'complete' | 'reopen' | 'skip' | 'restore';
        input?: { completedDate?: string; note?: string; reason?: string };
      }) => bucketListItemAction(itemId, action, input),
      onSuccess: refresh,
    }),
    prepareRollover: useMutation({
      mutationFn: ({
        listId,
        targetYear,
      }: {
        listId: string;
        targetYear: number;
      }) => prepareBucketListRollover(listId, targetYear),
    }),
    carry: useMutation({
      mutationFn: ({
        listId,
        input,
      }: {
        listId: string;
        input: Parameters<typeof carryBucketListItems>[1];
      }) => carryBucketListItems(listId, input),
      onSuccess: refresh,
    }),
  };
}
