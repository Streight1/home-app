import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceView } from '../../app/workspace-navigation/workspace-navigation.types.js';
import { parseWorkspaceState } from '../../app/workspace-navigation/workspace-storage.js';
import { ExpeditionsDashboardWidget } from './components/dashboard/ExpeditionsDashboardWidget.js';
import { PackingMode } from './components/packing/PackingMode.js';
import { TripDetail } from './components/trips/TripDetail.js';
import type {
  ExpeditionsDashboard,
  Trip,
  TripWeightSummary,
} from './types/expeditions.types.js';

const workspace = vi.hoisted(() => ({
  navigate: vi.fn(),
  openOverlay: vi.fn(),
  closeOverlay: vi.fn(),
  view: { area: 'dashboard' } as WorkspaceView,
}));

vi.mock('../../app/workspace-navigation/useWorkspaceNavigation.js', () => ({
  useWorkspaceNavigation: () => workspace,
}));

function renderClient(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>{element}</QueryClientProvider>,
    ),
  };
}

const tripId = '10000000-0000-4000-8000-000000000001';
const itemId = '10000000-0000-4000-8000-000000000002';

const trip: Trip = {
  id: tripId,
  title: 'Letní víkend s tarpem',
  description: null,
  tripType: 'OVERNIGHT',
  status: 'PACKING',
  startsOn: '2026-08-15',
  endsOn: '2026-08-16',
  locationLabel: 'Jizerské hory',
  overnightCount: 1,
  targetBaseWeightGrams: 6_000,
  notes: null,
  createdFromTemplateId: null,
  archivedAt: null,
  updatedAt: '2026-07-31T08:00:00.000Z',
  participants: [
    {
      id: '10000000-0000-4000-8000-000000000003',
      displayName: 'Adam',
      avatarUrl: null,
      role: 'ORGANIZER',
    },
  ],
  items: [
    {
      id: itemId,
      sourceTemplateItemId: null,
      gearItemId: null,
      name: 'Tarp',
      categoryName: 'Přístřešek',
      quantity: '1',
      unitWeightGrams: 620,
      loadType: 'CARRIED',
      criticality: 'REQUIRED',
      isShared: true,
      assignedUserId: '10000000-0000-4000-8000-000000000003',
      packingStatus: 'PLANNED',
      packLocationLabel: 'Hlavní komora',
      notes: null,
      packedAt: null,
      packedByUserId: null,
      reviewOutcome: 'NOT_REVIEWED',
      reviewNotes: null,
      sortOrder: 0,
    },
  ],
  acknowledgedRuleCodes: [],
};

const summary: TripWeightSummary = {
  baseWeightGrams: 620,
  wornWeightGrams: 0,
  consumableWeightGrams: 0,
  startingPackWeightGrams: 620,
  systemWeightGrams: 620,
  packedWeightGrams: 0,
  totalPlannedWeightGrams: 620,
  targetBaseWeightGrams: 6_000,
  baseWeightDifferenceGrams: -5_380,
  categories: [{ key: 'Přístřešek', systemWeightGrams: 620 }],
  participantWeights: [
    {
      key: '10000000-0000-4000-8000-000000000003',
      displayName: 'Adam',
      systemWeightGrams: 620,
    },
  ],
  participants: [
    {
      id: '10000000-0000-4000-8000-000000000003',
      displayName: 'Adam',
    },
  ],
  heaviest: [{ id: itemId, name: 'Tarp', weightGrams: 620 }],
  readiness: {
    ready: false,
    packedCount: 0,
    totalCount: 1,
    unpackedRequiredCount: 1,
    missingRequiredCount: 0,
    unassignedSharedRequiredCount: 0,
    blockingItems: [{ id: itemId, name: 'Tarp' }],
    advisoryRules: [],
    disclaimer:
      'Kontrola vychází pouze z vašeho seznamu a nenahrazuje posouzení podmínek výpravy.',
  },
};

const dashboard: ExpeditionsDashboard = {
  nextTrip: {
    id: tripId,
    title: trip.title,
    startsOn: trip.startsOn,
    status: trip.status,
    packedCount: 0,
    totalCount: 1,
    missingRequiredCount: 0,
    baseWeightGrams: 620,
    targetBaseWeightGrams: 6_000,
  },
  navigationTarget: { area: 'expeditions', screen: 'trip', tripId },
};

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('expeditions UI', () => {
  beforeEach(() => {
    workspace.navigate.mockReset();
    workspace.openOverlay.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders the next trip and uses central dashboard actions', async () => {
    vi.mocked(fetch).mockResolvedValue(json(dashboard));
    const user = userEvent.setup();
    renderClient(<ExpeditionsDashboardWidget />);
    expect(
      await screen.findByText('Letní víkend s tarpem'),
    ).toBeInTheDocument();
    expect(screen.getByText(/0 z 1 položek sbaleno/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Nová výprava' }));
    expect(workspace.openOverlay).toHaveBeenCalledWith({
      kind: 'trip-create',
    });
    await user.click(
      screen.getByRole('button', { name: 'Pokračovat v balení' }),
    );
    expect(workspace.navigate).toHaveBeenCalledWith({
      area: 'expeditions',
      screen: 'trip',
      tripId,
    });
  });

  it('distinguishes an empty dashboard from an API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      json({
        nextTrip: null,
        navigationTarget: { area: 'expeditions', screen: 'overview' },
      }),
    );
    const first = renderClient(<ExpeditionsDashboardWidget />);
    expect(
      await screen.findByText('Žádná budoucí výprava'),
    ).toBeInTheDocument();
    first.unmount();
    vi.mocked(fetch).mockResolvedValueOnce(
      json({ message: 'Nedostupné' }, 503),
    );
    renderClient(<ExpeditionsDashboardWidget />);
    expect(
      await screen.findByText(/Přehled výprav se nepodařilo načíst/),
    ).toBeInTheDocument();
  });

  it('uses server-calculated weights in the mobile-safe packing mode', async () => {
    vi.mocked(fetch).mockResolvedValue(json(summary));
    const { container } = renderClient(
      <PackingMode trip={trip} canWrite={true} />,
    );
    expect(await screen.findByText(/sbaleno 0 g z 620 g/)).toBeInTheDocument();
    expect(screen.getByLabelText('Označit jako sbalené: Tarp')).toHaveClass(
      'size-6',
    );
    expect(container.querySelector('table')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Sbalit kategorii Přístřešek' }),
    ).toBeInTheDocument();
  });

  it('rolls an optimistic packing update back after an API failure', async () => {
    vi.mocked(fetch).mockImplementation(
      (input: string | URL | Request, init?: RequestInit) => {
        const path =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        if ((init?.method ?? 'GET') === 'POST')
          return Promise.resolve(
            json(
              {
                code: 'REQUEST_FAILED',
                message: 'Změnu se nepodařilo uložit.',
              },
              503,
            ),
          );
        if (path.endsWith('/weight-summary'))
          return Promise.resolve(json(summary));
        return Promise.resolve(json(trip));
      },
    );
    const user = userEvent.setup();
    renderClient(<TripDetail tripId={tripId} canWrite={true} />);
    const checkbox = await screen.findByLabelText('Označit jako sbalené: Tarp');
    await user.click(checkbox);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/trips/${tripId}/packing-status`),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(
      await screen.findByText(
        'Změnu se nepodařilo uložit. Původní stav byl obnoven.',
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(checkbox).not.toBeChecked());
  });

  it('edits only the trip snapshot and assigns a custom pack item', async () => {
    vi.mocked(fetch).mockImplementation(
      (input: string | URL | Request, init?: RequestInit) => {
        const path = new URL(
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url,
          window.location.origin,
        ).pathname;
        if (init?.method === 'PUT') return Promise.resolve(json(trip));
        if (path.endsWith('/weight-summary'))
          return Promise.resolve(json(summary));
        if (path.endsWith('/gear'))
          return Promise.resolve(
            json({
              items: [],
              pagination: {
                page: 1,
                pageSize: 100,
                totalItems: 0,
                totalPages: 0,
              },
            }),
          );
        return Promise.resolve(json(trip));
      },
    );
    const user = userEvent.setup();
    renderClient(<TripDetail tripId={tripId} canWrite={true} />);
    await user.click(
      await screen.findByRole('button', { name: 'Upravit seznam' }),
    );
    expect(
      screen.getByText(/Změny platí jen pro tuto výpravu/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Vlastní položka' }));
    const itemNames = screen.getAllByLabelText('Položka');
    const newItemName = itemNames.at(-1);
    expect(newItemName).toBeDefined();
    if (newItemName) await user.clear(newItemName);
    if (newItemName) await user.type(newItemName, 'Náhradní kartuše');
    await user.click(screen.getByRole('button', { name: 'Uložit seznam' }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/trips/${tripId}/pack-items`),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('Náhradní kartuše'),
        }),
      ),
    );
  });

  it('keeps expedition workspace and central dialogs under /app state', () => {
    expect(
      parseWorkspaceState({
        view: {
          area: 'expeditions',
          screen: 'trip',
          tripId,
        },
        overlay: { kind: 'gear-item-create' },
      }),
    ).toEqual({
      view: { area: 'expeditions', screen: 'trip', tripId },
      overlay: { kind: 'gear-item-create' },
    });
    expect(
      parseWorkspaceState({
        view: { area: 'expeditions', screen: 'gear' },
        overlay: { kind: 'trip-create' },
      }),
    ).toEqual({
      view: { area: 'expeditions', screen: 'gear' },
      overlay: { kind: 'trip-create' },
    });
    expect(window.location.pathname).not.toContain('expeditions');
    expect(window.location.pathname).not.toContain(tripId);
  });
});
