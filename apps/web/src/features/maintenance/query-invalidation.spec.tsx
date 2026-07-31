import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASKS_QUERY_KEY } from '../tasks/tasks.public.js';
import {
  MAINTENANCE_QUERY_KEY,
  useMaintenanceMutations,
} from './hooks/useMaintenance.js';

describe('maintenance cross-feature invalidation', () => {
  it('refreshes Tasks after creating an occurrence task', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    client.setQueryData(TASKS_QUERY_KEY, { marker: 'tasks' });
    client.setQueryData(MAINTENANCE_QUERY_KEY, { marker: 'maintenance' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: '10000000-0000-4000-8000-000000000001',
            taskId: '10000000-0000-4000-8000-000000000002',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    const hook = renderHook(() => useMaintenanceMutations(), { wrapper });

    await act(() =>
      hook.result.current.createTask.mutateAsync(
        '10000000-0000-4000-8000-000000000001',
      ),
    );

    expect(client.getQueryState(TASKS_QUERY_KEY)?.isInvalidated).toBe(true);
    expect(client.getQueryState(MAINTENANCE_QUERY_KEY)?.isInvalidated).toBe(
      true,
    );
  });
});
