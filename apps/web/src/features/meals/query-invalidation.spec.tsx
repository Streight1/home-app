import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMealsMutations } from './hooks/useMeals.js';
import { mealKeys } from './mealQueryKeys.js';

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

describe('meals query invalidation', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('refreshes pantry without invalidating recipes, planning, or shopping', async () => {
    const { client, wrapper } = setup();
    const recipeKey = mealKeys.recipeList({ page: 1 });
    const planKey = mealKeys.planRange('2026-07-27', '2026-08-02');
    client.setQueryData(mealKeys.pantry(), { items: [] });
    client.setQueryData(recipeKey, { items: [] });
    client.setQueryData(planKey, { items: [] });
    client.setQueryData(mealKeys.shopping(), { items: [] });
    client.setQueryData(mealKeys.dashboard(), { todayMeals: [] });
    vi.mocked(fetch).mockResolvedValue(response({ id: 'pantry-item' }));
    const hook = renderHook(() => useMealsMutations(), { wrapper });

    await act(() =>
      hook.result.current.savePantry.mutateAsync({
        itemId: null,
        input: {
          ingredientId: '10000000-0000-4000-8000-000000000001',
          status: 'AVAILABLE',
        },
      }),
    );

    expect(client.getQueryState(mealKeys.pantry())?.isInvalidated).toBe(true);
    expect(client.getQueryState(recipeKey)?.isInvalidated).toBe(false);
    expect(client.getQueryState(planKey)?.isInvalidated).toBe(false);
    expect(client.getQueryState(mealKeys.shopping())?.isInvalidated).toBe(
      false,
    );
    expect(client.getQueryState(mealKeys.dashboard())?.isInvalidated).toBe(
      false,
    );
  });

  it('keeps optimistic shopping updates scoped to shopping and dashboard', async () => {
    const { client, wrapper } = setup();
    const itemId = '10000000-0000-4000-8000-000000000002';
    const recipeKey = mealKeys.recipeList({ page: 1 });
    const planKey = mealKeys.planRange('2026-07-27', '2026-08-02');
    client.setQueryData(mealKeys.shopping(), {
      items: [{ items: [{ id: itemId, checked: false }] }],
    });
    client.setQueryData(mealKeys.dashboard(), { todayMeals: [] });
    client.setQueryData(mealKeys.pantry(), { items: [] });
    client.setQueryData(recipeKey, { items: [] });
    client.setQueryData(planKey, { items: [] });
    vi.mocked(fetch).mockResolvedValue(response({ id: itemId, checked: true }));
    const hook = renderHook(() => useMealsMutations(), { wrapper });

    await act(() =>
      hook.result.current.checkItem.mutateAsync({ itemId, checked: true }),
    );

    expect(client.getQueryState(mealKeys.shopping())?.isInvalidated).toBe(true);
    expect(client.getQueryState(mealKeys.dashboard())?.isInvalidated).toBe(
      true,
    );
    expect(client.getQueryState(mealKeys.pantry())?.isInvalidated).toBe(false);
    expect(client.getQueryState(recipeKey)?.isInvalidated).toBe(false);
    expect(client.getQueryState(planKey)?.isInvalidated).toBe(false);
  });
});
