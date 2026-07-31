import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExpeditionsDashboardWidget } from '../../features/expeditions/components/dashboard/ExpeditionsDashboardWidget.js';
import { GearItemDialog } from '../../features/expeditions/components/dialogs/GearItemDialog.js';
import { TripDialog } from '../../features/expeditions/components/dialogs/TripDialog.js';
import { ExpeditionsPage } from '../../features/expeditions/pages/ExpeditionsPage.js';
import type {
  ExpeditionsDashboard,
  GearItem,
  PackTemplate,
  Trip,
  TripWeightSummary,
} from '../../features/expeditions/types/expeditions.types.js';
import { AppShell } from '../../layouts/AppShell/AppShell.js';

const member = {
  id: '84000000-0000-4000-8000-000000000001',
  email: 'jana@example.test',
  displayName: 'Jana Nováková',
  avatarUrl: null,
  role: 'OWNER',
  calendarColorToken: 'cyan',
} as const;

const category = {
  id: '84000000-0000-4000-8000-000000000002',
  name: 'Přístřešek',
  iconKey: 'tent',
  colorToken: 'green',
  sortOrder: 0,
};

const gear: GearItem = {
  id: '84000000-0000-4000-8000-000000000003',
  name: 'Tarp 3 × 3 m',
  brand: 'Outdoor',
  model: 'Sil',
  description: 'Lehký přístřešek pro dvě osoby.',
  notes: null,
  weightGrams: 620,
  weightStatus: 'VERIFIED',
  defaultLoadType: 'CARRIED',
  defaultCriticality: 'REQUIRED',
  isHouseholdShared: true,
  defaultQuantity: '1',
  purchaseUrl: null,
  productUrl: null,
  imageSourceUrl: null,
  imageAttribution: null,
  archivedAt: null,
  category,
  owner: null,
  coverDocumentId: '84000000-0000-4000-8000-000000000004',
  updatedAt: '2026-07-31T08:00:00.000Z',
};

const packItem = {
  id: '84000000-0000-4000-8000-000000000005',
  sourceTemplateItemId: '84000000-0000-4000-8000-000000000006',
  gearItemId: gear.id,
  name: gear.name,
  categoryName: category.name,
  quantity: '1',
  unitWeightGrams: gear.weightGrams,
  loadType: 'CARRIED' as const,
  criticality: 'REQUIRED' as const,
  isShared: true,
  assignedUserId: member.id,
  packingStatus: 'PACKED' as const,
  packLocationLabel: 'Hlavní komora',
  notes: null,
  packedAt: '2026-07-31T08:00:00.000Z',
  packedByUserId: member.id,
  reviewOutcome: 'NOT_REVIEWED' as const,
  reviewNotes: null,
  sortOrder: 0,
};

const trip: Trip = {
  id: '84000000-0000-4000-8000-000000000007',
  title: 'Letní víkend s tarpem',
  description: 'Dvě noci v Jizerských horách.',
  tripType: 'MULTI_DAY_TREK',
  status: 'PACKING',
  startsOn: '2026-08-15',
  endsOn: '2026-08-17',
  locationLabel: 'Jizerské hory',
  overnightCount: 2,
  targetBaseWeightGrams: 6_000,
  notes: null,
  createdFromTemplateId: '84000000-0000-4000-8000-000000000008',
  archivedAt: null,
  updatedAt: '2026-07-31T08:00:00.000Z',
  participants: [
    {
      id: member.id,
      displayName: member.displayName,
      avatarUrl: null,
      role: 'ORGANIZER',
    },
  ],
  items: [
    packItem,
    {
      ...packItem,
      id: '84000000-0000-4000-8000-000000000009',
      sourceTemplateItemId: '84000000-0000-4000-8000-000000000010',
      gearItemId: null,
      name: 'Voda na první etapu',
      categoryName: 'Voda',
      quantity: '2',
      unitWeightGrams: 1_000,
      loadType: 'CONSUMABLE',
      packingStatus: 'PLANNED',
      isShared: false,
      packedAt: null,
      packedByUserId: null,
      sortOrder: 1,
    },
    {
      ...packItem,
      id: '84000000-0000-4000-8000-000000000011',
      sourceTemplateItemId: null,
      gearItemId: null,
      name: 'Lékárnička',
      categoryName: 'Lékárnička',
      unitWeightGrams: 280,
      packingStatus: 'MISSING',
      isShared: false,
      packedAt: null,
      packedByUserId: null,
      sortOrder: 2,
    },
  ],
  acknowledgedRuleCodes: [],
};

const template: PackTemplate = {
  id: trip.createdFromTemplateId ?? '',
  name: 'Letní víkend s tarpem',
  description: 'Základní seznam pro dvě noci.',
  tripType: 'MULTI_DAY_TREK',
  seasonLabel: 'léto',
  targetBaseWeightGrams: 6_000,
  defaultParticipantCount: 2,
  archivedAt: null,
  updatedAt: '2026-07-31T08:00:00.000Z',
  items: trip.items.slice(0, 2).map((item) => ({
    id: item.sourceTemplateItemId ?? item.id,
    gearItemId: item.gearItemId,
    name: item.name,
    categoryId: item.gearItemId ? category.id : null,
    categoryName: item.categoryName,
    quantity: item.quantity,
    unitWeightGrams: item.unitWeightGrams,
    loadType: item.loadType,
    criticality: item.criticality,
    isShared: item.isShared,
    defaultAssignedUserId: item.assignedUserId,
    packLocationLabel: item.packLocationLabel,
    notes: item.notes,
    sortOrder: item.sortOrder,
  })),
};

const summary: TripWeightSummary = {
  baseWeightGrams: 900,
  wornWeightGrams: 0,
  consumableWeightGrams: 2_000,
  startingPackWeightGrams: 2_900,
  systemWeightGrams: 2_900,
  packedWeightGrams: 620,
  totalPlannedWeightGrams: 2_900,
  targetBaseWeightGrams: 6_000,
  baseWeightDifferenceGrams: -5_100,
  categories: [
    { key: 'Přístřešek', systemWeightGrams: 620 },
    { key: 'Voda', systemWeightGrams: 2_000 },
    { key: 'Lékárnička', systemWeightGrams: 280 },
  ],
  participantWeights: [
    {
      key: member.id,
      displayName: member.displayName,
      systemWeightGrams: 2_900,
    },
  ],
  participants: [{ id: member.id, displayName: member.displayName }],
  heaviest: [
    {
      id: trip.items[1]?.id ?? '',
      name: 'Voda na první etapu',
      weightGrams: 2_000,
    },
    { id: packItem.id, name: packItem.name, weightGrams: 620 },
  ],
  readiness: {
    ready: false,
    packedCount: 1,
    totalCount: 3,
    unpackedRequiredCount: 2,
    missingRequiredCount: 1,
    unassignedSharedRequiredCount: 0,
    blockingItems: [
      { id: trip.items[1]?.id ?? '', name: 'Voda na první etapu' },
      { id: trip.items[2]?.id ?? '', name: 'Lékárnička' },
    ],
    advisoryRules: [
      {
        code: 'NO_NAVIGATION',
        reason: 'Seznam neobsahuje kategorii Navigace.',
        acknowledged: false,
      },
    ],
    disclaimer:
      'Kontrola vychází pouze z vašeho seznamu a nenahrazuje posouzení podmínek výpravy.',
  },
};

const dashboard: ExpeditionsDashboard = {
  nextTrip: {
    id: trip.id,
    title: trip.title,
    startsOn: trip.startsOn,
    status: trip.status,
    packedCount: summary.readiness.packedCount,
    totalCount: summary.readiness.totalCount,
    missingRequiredCount: summary.readiness.missingRequiredCount,
    baseWeightGrams: summary.baseWeightGrams,
    targetBaseWeightGrams: summary.targetBaseWeightGrams,
  },
  navigationTarget: { area: 'expeditions', screen: 'trip', tripId: trip.id },
};

function installFixture() {
  window.fetch = (input) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const path = new URL(url, window.location.origin).pathname;
    const body = path.endsWith('/auth/me')
      ? {
          user: member,
          activeHousehold: {
            id: '84000000-0000-4000-8000-000000000012',
            name: 'Moje domácnost',
            role: 'OWNER',
          },
        }
      : path.endsWith('/household/members')
        ? [member]
        : path.endsWith(`/trips/${trip.id}/weight-summary`)
          ? summary
          : path.endsWith(`/trips/${trip.id}/template-review-preview`)
            ? {
                available: true,
                templateId: template.id,
                templateName: template.name,
                remove: [],
                add: [],
              }
            : path.endsWith(`/trips/${trip.id}`)
              ? trip
              : path.endsWith('/trips/dashboard')
                ? dashboard
                : path.endsWith('/trips')
                  ? [trip]
                  : path.endsWith('/pack-templates')
                    ? [template]
                    : path.endsWith('/gear-categories')
                      ? [category]
                      : path.endsWith('/gear')
                        ? {
                            items: [gear],
                            pagination: {
                              page: 1,
                              pageSize: 50,
                              totalItems: 1,
                              totalPages: 1,
                            },
                          }
                        : path.endsWith('/documents')
                          ? {
                              items: [],
                              pagination: {
                                page: 1,
                                pageSize: 100,
                                totalItems: 0,
                                totalPages: 0,
                              },
                            }
                          : { items: [] };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
}

function ExpeditionsScreen({
  screen = 'overview',
}: {
  screen?: 'overview' | 'trips' | 'templates' | 'gear' | 'trip';
}) {
  installFixture();
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName={member.displayName}
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <ExpeditionsPage
        screen={screen}
        {...(screen === 'trip' ? { tripId: trip.id } : {})}
        role="OWNER"
        onScreenChange={() => undefined}
      />
    </AppShell>
  );
}

function DialogScreen({ kind }: { kind: 'trip' | 'gear' }) {
  installFixture();
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName={member.displayName}
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="rounded-lg border border-border bg-surface-raised p-6">
        <h1 className="text-page-title font-semibold">Výpravy</h1>
      </div>
      {kind === 'trip' ? (
        <TripDialog open onOpenChange={() => undefined} />
      ) : (
        <GearItemDialog open onOpenChange={() => undefined} />
      )}
    </AppShell>
  );
}

function DashboardScreen() {
  installFixture();
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName={member.displayName}
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <ExpeditionsDashboardWidget />
      </div>
    </AppShell>
  );
}

const meta = {
  title: 'Screens/Expeditions',
  component: ExpeditionsScreen,
  parameters: { route: '/app', workspace: 'expeditions' },
} satisfies Meta<typeof ExpeditionsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OverviewLight: Story = {
  parameters: { theme: 'light' },
};

export const OverviewDark: Story = {
  parameters: { theme: 'dark' },
};

export const GearLight: Story = {
  args: { screen: 'gear' },
  parameters: { theme: 'light' },
};

export const TemplatesDark: Story = {
  args: { screen: 'templates' },
  parameters: { theme: 'dark' },
};

export const PackingMobile: Story = {
  args: { screen: 'trip' },
  parameters: { theme: 'light' },
};

export const PackingDark: Story = {
  args: { screen: 'trip' },
  parameters: { theme: 'dark' },
};

export const TripCreateDialog: Story = {
  render: () => <DialogScreen kind="trip" />,
  parameters: { theme: 'light' },
};

export const GearCreateDialog: Story = {
  render: () => <DialogScreen kind="gear" />,
  parameters: { theme: 'light' },
};

export const DashboardWidget: Story = {
  render: () => <DashboardScreen />,
  parameters: { theme: 'dark', workspace: 'dashboard' },
};
