import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState.js';
import { IconButton } from '../../../components/ui/IconButton/IconButton.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../components/ui/LoadingScreen/LoadingScreen.js';
import {
  useHouseholdMembers,
  type HouseholdRole,
} from '../../household/household.public.js';
import { BucketListActionDialog } from '../components/dialogs/BucketListActionDialog.js';
import { BucketListItemDialog } from '../components/dialogs/BucketListItemDialog.js';
import { BucketListRolloverDialog } from '../components/dialogs/BucketListRolloverDialog.js';
import { BucketListItemCard } from '../components/list/BucketListItemCard.js';
import { BucketListProgressPanel } from '../components/list/BucketListProgressPanel.js';
import { BucketListToolbar } from '../components/list/BucketListToolbar.js';
import {
  useBucketListItems,
  useBucketListMutations,
  useBucketLists,
} from '../hooks/useBucketList.js';
import type {
  BucketListFilters,
  BucketListItem,
} from '../types/bucket-list.types.js';

export function BucketListPage({ role }: { role: HouseholdRole }) {
  const workspace = useWorkspaceNavigation();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [filters, setFilters] = useState<BucketListFilters>({
    sortBy: 'sortOrder',
    sortDirection: 'asc',
  });
  const [editing, setEditing] = useState<BucketListItem | 'new' | null>(null);
  const [action, setAction] = useState<{
    item: BucketListItem;
    kind: 'complete' | 'skip' | 'delete';
  } | null>(null);
  const [rolloverOpen, setRolloverOpen] = useState(false);
  const lists = useBucketLists(year);
  const members = useHouseholdMembers();
  const list = lists.data?.items[0] ?? null;
  const items = useBucketListItems(list?.id ?? null, filters);
  const mutations = useBucketListMutations();
  const canWrite = role !== 'VIEWER';
  if (lists.isLoading)
    return <LoadingScreen embedded message="Načítáme bucket list…" />;
  return (
    <div className="grid gap-5">
      <header className="aurora-header-surface rounded-lg border border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              Společné plány
            </p>
            <h1 className="mt-1 text-page-title font-semibold">Bucket list</h1>
            <p className="mt-2 max-w-2xl text-body-sm text-text-muted">
              Přání a zážitky, které chcete letos uskutečnit společně.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface-raised p-1">
            <IconButton
              aria-label="Předchozí rok"
              onClick={() => setYear((current) => current - 1)}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </IconButton>
            <strong className="min-w-20 text-center tabular-nums">
              {year}
            </strong>
            <IconButton
              aria-label="Následující rok"
              onClick={() => setYear((current) => current + 1)}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      </header>
      {lists.isError ? (
        <InlineAlert variant="danger">
          Roční seznam se nepodařilo načíst.
        </InlineAlert>
      ) : null}
      {!list ? (
        <EmptyState
          eyebrow={<Sparkles className="mx-auto size-6" aria-hidden="true" />}
          title={`Pro rok ${String(year)} zatím nemáte bucket list`}
          description="Založte společný seznam bez ukázkových nebo smyšlených položek."
          action={
            canWrite ? (
              <Button
                variant="primary"
                loading={mutations.createList.isPending}
                onClick={() =>
                  mutations.createList.mutate({ year, status: 'ACTIVE' })
                }
              >
                Založit seznam pro {year}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="rounded-lg border border-border bg-surface-raised p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-section-title font-semibold">
                    {list.title}
                  </h2>
                  <p className="mt-1 text-body-sm text-text-muted">
                    {list.description ??
                      'Společný prostor pro letošní přání a zážitky.'}
                  </p>
                </div>
                {canWrite && list.permissions.canEdit ? (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setRolloverOpen(true)}>
                      Přenést do {list.year + 1}
                    </Button>
                    <Button variant="primary" onClick={() => setEditing('new')}>
                      <Plus className="size-4" aria-hidden="true" /> Přidat
                      přání
                    </Button>
                  </div>
                ) : null}
              </div>
            </section>
            <BucketListProgressPanel progress={list.progress} />
          </div>
          <BucketListToolbar
            filters={filters}
            participants={members.data ?? []}
            onChange={setFilters}
          />
          {items.isError ? (
            <InlineAlert variant="danger">
              Položky se nepodařilo načíst. Zkuste to znovu.
            </InlineAlert>
          ) : null}
          {items.isLoading ? (
            <LoadingScreen embedded message="Načítáme přání…" />
          ) : null}
          {items.data?.items.length === 0 ? (
            <EmptyState
              title="V tomto pohledu nic není"
              description={
                Object.keys(filters).length > 2
                  ? 'Změňte filtry nebo přidejte nové přání.'
                  : 'Začněte prvním společným cílem nebo zážitkem.'
              }
              action={
                canWrite ? (
                  <Button variant="primary" onClick={() => setEditing('new')}>
                    Přidat první přání
                  </Button>
                ) : undefined
              }
            />
          ) : null}
          <div className="grid gap-3 lg:grid-cols-2">
            {items.data?.items.map((item) => (
              <BucketListItemCard
                key={item.id}
                item={item}
                busy={mutations.lifecycle.isPending}
                onOpen={() =>
                  workspace.navigate({
                    area: 'bucket-list',
                    screen: 'item',
                    itemId: item.id,
                  })
                }
                onEdit={() => setEditing(item)}
                onAction={(kind) => {
                  if (kind === 'reopen' || kind === 'restore')
                    mutations.lifecycle.mutate({
                      itemId: item.id,
                      action: kind,
                    });
                  else setAction({ item, kind });
                }}
              />
            ))}
          </div>
          <BucketListItemDialog
            listId={list.id}
            {...(editing && editing !== 'new' ? { item: editing } : {})}
            open={editing !== null}
            onOpenChange={(open) => !open && setEditing(null)}
          />
          <BucketListRolloverDialog
            list={list}
            open={rolloverOpen}
            onOpenChange={setRolloverOpen}
          />
          {action ? (
            <BucketListActionDialog
              item={action.item}
              action={action.kind}
              onClose={() => setAction(null)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
