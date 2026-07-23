import type { Meta, StoryObj } from '@storybook/react-vite';
import { BucketListDashboardWidget } from '../../features/bucket-list/components/dashboard/BucketListDashboardWidget.js';
import { AppShell } from '../../layouts/AppShell/AppShell.js';
import { BucketListPage } from '../../features/bucket-list/pages/BucketListPage.js';
import type {
  BucketList,
  BucketListItem,
} from '../../features/bucket-list/types/bucket-list.types.js';

const listId = '81000000-0000-4000-8000-000000000001';
const participant = {
  id: '81000000-0000-4000-8000-000000000002',
  displayName: 'Jana Nováková',
  email: 'jana@example.test',
  avatarUrl: null,
  calendarColorToken: 'violet',
};

const list: BucketList = {
  id: listId,
  year: 2026,
  title: 'Náš Bucket list 2026',
  description: 'Společné zážitky, na které se chceme letos těšit.',
  status: 'ACTIVE',
  progress: {
    planned: 2,
    completed: 1,
    skipped: 0,
    total: 3,
    percent: 33,
  },
  createdAt: '2026-01-02T10:00:00.000Z',
  updatedAt: '2026-07-15T10:00:00.000Z',
  permissions: { canEdit: true, canClose: true, canArchive: true },
};

function item(
  id: string,
  title: string,
  category: BucketListItem['category'],
  targetDate: string | null,
): BucketListItem {
  return {
    id,
    bucketListId: listId,
    title,
    description:
      'Skutečný společný plán bez automatického termínu v kalendáři.',
    category,
    priority: 'NORMAL',
    status: 'PLANNED',
    targetDate,
    location: {
      placeId: null,
      label: category === 'TRAVEL' ? 'Český ráj' : null,
      notes: null,
      routable: false,
    },
    notes: null,
    sortOrder: 0,
    participants: [participant],
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
}

const items = [
  item(
    '81000000-0000-4000-8000-000000000003',
    'Projít Prachovské skály',
    'TRAVEL',
    '2026-08-15',
  ),
  item(
    '81000000-0000-4000-8000-000000000004',
    'Naučit se připravit domácí ramen',
    'FOOD',
    null,
  ),
];

function installBucketListFixture(empty: boolean) {
  window.fetch = (input) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const body = url.includes('/auth/me')
      ? {
          user: {
            id: participant.id,
            email: participant.email,
            displayName: participant.displayName,
            avatarUrl: participant.avatarUrl,
          },
          activeHousehold: {
            id: '81000000-0000-4000-8000-000000000005',
            name: 'Moje domácnost',
            role: 'OWNER',
          },
        }
      : url.includes('/bucket-lists/dashboard')
        ? {
            year: 2026,
            list: empty
              ? null
              : { id: list.id, title: list.title, status: list.status },
            progress: empty
              ? {
                  planned: 0,
                  completed: 0,
                  skipped: 0,
                  total: 0,
                  percent: 0,
                }
              : list.progress,
            items: empty
              ? []
              : items.map((current) => ({
                  id: current.id,
                  title: current.title,
                  status: current.status,
                  category: current.category,
                  priority: current.priority,
                  targetDate: current.targetDate,
                  participants: current.participants.map((member) => ({
                    id: member.id,
                    displayName: member.displayName,
                    avatarUrl: member.avatarUrl,
                  })),
                  permissions: { canComplete: true },
                  navigationTarget: {
                    area: 'bucket-list',
                    screen: 'item',
                    itemId: current.id,
                  },
                })),
          }
        : url.includes('/household/members')
          ? [
              {
                ...participant,
                role: 'OWNER',
              },
            ]
          : url.includes(`/${listId}/items`)
            ? { items: empty ? [] : items }
            : { items: empty ? [] : [list] };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
}

function DashboardScreen() {
  installBucketListFixture(false);
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="grid grid-cols-12 gap-4">
        <BucketListDashboardWidget />
      </div>
    </AppShell>
  );
}

function BucketListScreen({ empty = false }: { empty?: boolean }) {
  installBucketListFixture(empty);
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <BucketListPage role="OWNER" />
    </AppShell>
  );
}

const meta = {
  title: 'Screens/Bucket list',
  component: BucketListScreen,
  parameters: { route: '/app', workspace: 'bucket-list' },
} satisfies Meta<typeof BucketListScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PopulatedDark: Story = {
  parameters: { theme: 'dark' },
};

export const PopulatedLight: Story = {
  parameters: { theme: 'light' },
};

export const EmptyDark: Story = {
  args: { empty: true },
  parameters: { theme: 'dark' },
};

export const EmptyLight: Story = {
  args: { empty: true },
  parameters: { theme: 'light' },
};

export const DashboardLight: Story = {
  parameters: { theme: 'light' },
  render: () => <DashboardScreen />,
};

export const DashboardDark: Story = {
  parameters: { theme: 'dark' },
  render: () => <DashboardScreen />,
};
