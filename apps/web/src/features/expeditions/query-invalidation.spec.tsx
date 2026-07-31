import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TASKS_QUERY_KEY } from '../tasks/tasks.public.js';
import { expeditionKeys } from './expeditionQueryKeys.js';
import { useExpeditionMutations } from './hooks/useExpeditions.js';
import type { Trip } from './types/expeditions.types.js';

const response = (value: unknown) =>
  new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('expedition query invalidation', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('refreshes packing projections without invalidating gear or templates', async () => {
    const { client, wrapper } = setup();
    const tripId = '10000000-0000-4000-8000-000000000001';
    const itemId = '10000000-0000-4000-8000-000000000002';
    const trip = {
      id: tripId,
      items: [{ id: itemId, packingStatus: 'PLANNED', packedAt: null }],
    } as Trip;
    client.setQueryData(expeditionKeys.trip(tripId), trip);
    client.setQueryData(expeditionKeys.trips(), [trip]);
    client.setQueryData(expeditionKeys.weight(tripId), { baseWeightGrams: 1 });
    client.setQueryData(expeditionKeys.dashboard(), { nextTrip: null });
    client.setQueryData(expeditionKeys.gearList({ page: 1 }), { items: [] });
    client.setQueryData(expeditionKeys.templates(), []);
    vi.mocked(fetch).mockResolvedValue(response(trip));
    const hook = renderHook(() => useExpeditionMutations(), { wrapper });

    await act(() =>
      hook.result.current.packing.mutateAsync({
        tripId,
        itemIds: [itemId],
        status: 'PACKED',
      }),
    );

    expect(
      client.getQueryState(expeditionKeys.trip(tripId))?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(expeditionKeys.weight(tripId))?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(expeditionKeys.gearList({ page: 1 }))?.isInvalidated,
    ).toBe(false);
    expect(
      client.getQueryState(expeditionKeys.templates())?.isInvalidated,
    ).toBe(false);
  });

  it('invalidates the public Tasks cache after creating a linked task only', async () => {
    const { client, wrapper } = setup();
    const tripId = '10000000-0000-4000-8000-000000000001';
    client.setQueryData(TASKS_QUERY_KEY, { marker: 'tasks' });
    client.setQueryData(expeditionKeys.trip(tripId), { marker: 'trip' });
    client.setQueryData(expeditionKeys.gear(), { marker: 'gear' });
    vi.mocked(fetch).mockResolvedValue(
      response({ taskId: '10000000-0000-4000-8000-000000000003' }),
    );
    const hook = renderHook(() => useExpeditionMutations(), { wrapper });

    await act(() =>
      hook.result.current.createTask.mutateAsync({
        tripId,
        input: { title: 'Opravit zip' },
      }),
    );

    expect(client.getQueryState(TASKS_QUERY_KEY)?.isInvalidated).toBe(true);
    expect(
      client.getQueryState(expeditionKeys.trip(tripId))?.isInvalidated,
    ).toBe(false);
    expect(client.getQueryState(expeditionKeys.gear())?.isInvalidated).toBe(
      false,
    );
  });

  it('invalidates template review suggestions after saving the trip review', async () => {
    const { client, wrapper } = setup();
    const tripId = '10000000-0000-4000-8000-000000000001';
    const trip = { id: tripId, items: [] } as unknown as Trip;
    client.setQueryData(expeditionKeys.trip(tripId), trip);
    client.setQueryData(expeditionKeys.templateReview(tripId), {
      available: true,
      remove: [],
      add: [],
    });
    client.setQueryData(expeditionKeys.categories(), []);
    vi.mocked(fetch).mockResolvedValue(response(trip));
    const hook = renderHook(() => useExpeditionMutations(), { wrapper });

    await act(() =>
      hook.result.current.review.mutateAsync({ tripId, items: [] }),
    );

    expect(
      client.getQueryState(expeditionKeys.templateReview(tripId))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(expeditionKeys.categories())?.isInvalidated,
    ).toBe(false);
  });
});
