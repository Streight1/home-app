import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseWorkspaceState } from '../../app/workspace-navigation/workspace-storage.js';
import { BucketListDashboardWidget } from './components/dashboard/BucketListDashboardWidget.js';
import { BucketListItemCard } from './components/list/BucketListItemCard.js';
import { BucketListProgressPanel } from './components/list/BucketListProgressPanel.js';
import { BucketListToolbar } from './components/list/BucketListToolbar.js';
import {
  bucketListItemInput,
  initialBucketListItemValues,
} from './components/forms/bucketListItemFormValues.js';
import { formatBucketDate } from './lib/bucketListLabels.js';
import type {
  BucketListDashboard,
  BucketListItem,
} from './types/bucket-list.types.js';

const workspace = vi.hoisted(() => ({
  navigate: vi.fn(),
  openOverlay: vi.fn(),
  closeOverlay: vi.fn(),
  view: { area: 'dashboard' as const },
}));

vi.mock('../../app/workspace-navigation/useWorkspaceNavigation.js', () => ({
  useWorkspaceNavigation: () => workspace,
}));

function renderClient(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

const item: BucketListItem = {
  id: '10000000-0000-4000-8000-000000000001',
  bucketListId: '10000000-0000-4000-8000-000000000002',
  title: 'Výlet do Českého ráje',
  description: 'Projít společně Prachovské skály.',
  category: 'TRAVEL',
  priority: 'HIGH',
  status: 'PLANNED',
  targetDate: '2026-08-15',
  location: {
    placeId: '10000000-0000-4000-8000-000000000003',
    label: 'Český ráj',
    notes: null,
    routable: true,
  },
  notes: null,
  sortOrder: 0,
  participants: [
    {
      id: '10000000-0000-4000-8000-000000000004',
      displayName: 'Adam',
      email: 'adam@example.test',
      avatarUrl: null,
      calendarColorToken: 'violet',
    },
  ],
  documents: [],
  completion: null,
  skipped: null,
  completions: [],
  rollover: { carriedFrom: null, carriedTo: null },
  permissions: {
    canEdit: true,
    canComplete: true,
    canReopen: false,
    canSkip: true,
    canRestore: false,
    canDelete: true,
  },
};
const primaryParticipant = item.participants[0];
if (!primaryParticipant)
  throw new Error('Bucket list fixture needs a participant');

const dashboard: BucketListDashboard = {
  year: 2026,
  list: {
    id: '10000000-0000-4000-8000-000000000002',
    title: 'Bucket list 2026',
    status: 'ACTIVE',
  },
  progress: { planned: 1, completed: 2, skipped: 1, total: 4, percent: 50 },
  items: [
    {
      id: item.id,
      title: item.title,
      status: 'PLANNED',
      category: 'TRAVEL',
      priority: 'HIGH',
      targetDate: item.targetDate,
      participants: [
        {
          id: primaryParticipant.id,
          displayName: 'Adam',
          avatarUrl: null,
        },
      ],
      permissions: { canComplete: true },
      navigationTarget: {
        area: 'bucket-list',
        screen: 'item',
        itemId: item.id,
      },
    },
  ],
};

describe('bucket list UI', () => {
  beforeEach(() => {
    workspace.navigate.mockReset();
    workspace.openOverlay.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('announces yearly progress from real counts', () => {
    render(
      <BucketListProgressPanel
        progress={{
          planned: 4,
          completed: 3,
          skipped: 1,
          total: 8,
          percent: 38,
        }}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '38',
    );
    expect(screen.getByText('3 z 8')).toBeInTheDocument();
  });

  it('renders a compact mobile-safe item card without a table', () => {
    const { container } = render(
      <BucketListItemCard
        item={item}
        onOpen={vi.fn()}
        onEdit={vi.fn()}
        onAction={vi.fn()}
      />,
    );
    expect(screen.getByText('Výlet do Českého ráje')).toBeInTheDocument();
    expect(screen.getByText('Český ráj')).toBeInTheDocument();
    expect(container.querySelector('table')).toBeNull();
  });

  it('does not expose mutation controls to a viewer', () => {
    render(
      <BucketListItemCard
        item={{
          ...item,
          permissions: {
            canEdit: false,
            canComplete: false,
            canReopen: false,
            canSkip: false,
            canRestore: false,
            canDelete: false,
          },
        }}
        onOpen={vi.fn()}
        onEdit={vi.fn()}
        onAction={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Další akce/ }),
    ).not.toBeInTheDocument();
  });

  it('keeps list filters in component state rather than the browser URL', async () => {
    const onChange = vi.fn();
    render(
      <BucketListToolbar
        filters={{ sortBy: 'sortOrder', sortDirection: 'asc' }}
        participants={[primaryParticipant]}
        onChange={onChange}
      />,
    );
    await userEvent.type(screen.getByPlaceholderText('Hledat přání'), 'výlet');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 't' }),
    );
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Účastník' }),
      primaryParticipant.id,
    );
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ participantUserId: primaryParticipant.id }),
    );
    expect(window.location.search).toBe('');
  });

  it('preserves participants, documents and a date-only target in form mapping', () => {
    const values = initialBucketListItemValues(item, undefined);
    expect(bucketListItemInput(values)).toMatchObject({
      targetDate: '2026-08-15',
      participantUserIds: [primaryParticipant.id],
      documentIds: [],
    });
    expect(formatBucketDate('2026-08-15')).toMatch(/15. srpna 2026/);
  });

  it('loads the dashboard model and opens internal item navigation', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(dashboard), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    renderClient(<BucketListDashboardWidget />);
    await userEvent.click(await screen.findByText(item.title));
    const dashboardItem = dashboard.items[0];
    if (!dashboardItem) throw new Error('Dashboard fixture needs an item');
    expect(workspace.navigate).toHaveBeenCalledWith(
      dashboardItem.navigationTarget,
    );
    expect(window.location.pathname).not.toContain(item.id);
  });

  it('quick-completes through the shared lifecycle endpoint', async () => {
    document.cookie = 'homeapp_csrf=csrf-token; path=/';
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(dashboard), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValue(
        new Response(JSON.stringify({ ...item, status: 'COMPLETED' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    renderClient(<BucketListDashboardWidget />);
    await userEvent.click(
      await screen.findByRole('button', {
        name: `Označit přání „${item.title}“ jako splněné`,
      }),
    );
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/bucket-list-items/${item.id}/complete`),
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      ),
    );
  });

  it('shows a genuine empty state without fixture items', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          year: 2026,
          list: null,
          progress: {
            planned: 0,
            completed: 0,
            skipped: 0,
            total: 0,
            percent: 0,
          },
          items: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    renderClient(<BucketListDashboardWidget />);
    expect(
      await screen.findByText('Letošní bucket list ještě není založený'),
    ).toBeInTheDocument();
    expect(screen.queryByText(item.title)).not.toBeInTheDocument();
  });

  it('validates internal detail navigation without exposing UUIDs in URLs', () => {
    expect(
      parseWorkspaceState({
        view: { area: 'bucket-list', screen: 'item', itemId: item.id },
      }),
    ).toEqual({
      view: { area: 'bucket-list', screen: 'item', itemId: item.id },
    });
    expect(window.location.pathname).not.toContain(item.id);
  });
});
