import { ArrowRight, Check, Plus, Sparkles } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import {
  useBucketListDashboard,
  useBucketListMutations,
} from '../../hooks/useBucketList.js';
import { formatBucketDate } from '../../lib/bucketListLabels.js';

export function BucketListDashboardWidget() {
  const workspace = useWorkspaceNavigation();
  const dashboard = useBucketListDashboard();
  const mutations = useBucketListMutations();
  const data = dashboard.data;
  const list = data?.list;
  const openList = () =>
    workspace.navigate({ area: 'bucket-list', screen: 'overview' });
  return (
    <section
      className="md:col-span-12"
      aria-labelledby="bucket-list-dashboard-title"
    >
      <div className="rounded-lg border border-border bg-surface-raised p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              Společné sny
            </p>
            <h2
              id="bucket-list-dashboard-title"
              className="mt-1 text-section-title font-semibold"
            >
              Bucket list {data?.year ?? ''}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {list ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-body-sm font-medium text-primary-emphasis focus-visible:outline-2 focus-visible:outline-focus"
                onClick={() =>
                  workspace.openOverlay({
                    kind: 'bucket-list-item-create',
                    listId: list.id,
                  })
                }
              >
                <Plus className="size-4" aria-hidden="true" /> Přidat přání
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-body-sm font-medium text-primary-emphasis focus-visible:outline-2 focus-visible:outline-focus"
              onClick={openList}
            >
              Zobrazit seznam
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        {dashboard.isError ? (
          <div className="mt-4">
            <InlineAlert variant="danger">
              Bucket list se nepodařilo načíst.
              <button
                type="button"
                className="ml-3 min-h-11 rounded-md px-3 font-medium underline focus-visible:outline-2 focus-visible:outline-focus"
                onClick={() => void dashboard.refetch()}
              >
                Zkusit znovu
              </button>
            </InlineAlert>
          </div>
        ) : null}
        {list ? (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 text-body-sm">
              <span>Splněno {data.progress.completed} přání</span>
              <strong className="tabular-nums">
                {data.progress.percent} %
              </strong>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-skeleton">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${String(data.progress.percent)}%` }}
              />
            </div>
          </div>
        ) : null}
        {data && !list ? (
          <div className="mt-4">
            <EmptyState
              compact
              eyebrow={
                <Sparkles className="mx-auto size-5" aria-hidden="true" />
              }
              title="Letošní bucket list ještě není založený"
              description="Vytvořte ho v samostatné oblasti společné domácnosti."
              action={
                <button
                  type="button"
                  className="aurora-primary-action min-h-11 rounded-md px-4 text-body-sm font-medium text-primary-foreground"
                  onClick={openList}
                >
                  Založit bucket list
                </button>
              }
            />
          </div>
        ) : null}
        {data?.items.length ? (
          <ul className="mt-4 divide-y divide-border">
            {data.items.map((item) => (
              <li
                key={item.id}
                className="flex min-h-14 items-center gap-3 py-2"
              >
                {item.permissions.canComplete && item.status === 'PLANNED' ? (
                  <IconButton
                    aria-label={`Označit přání „${item.title}“ jako splněné`}
                    loading={
                      mutations.lifecycle.isPending &&
                      mutations.lifecycle.variables.itemId === item.id
                    }
                    onClick={() =>
                      mutations.lifecycle.mutate({
                        itemId: item.id,
                        action: 'complete',
                      })
                    }
                  >
                    <Check className="size-5" aria-hidden="true" />
                  </IconButton>
                ) : null}
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-focus"
                  onClick={() => workspace.navigate(item.navigationTarget)}
                >
                  <strong className="block truncate">{item.title}</strong>
                  <span className="text-caption text-text-muted">
                    {formatBucketDate(item.targetDate) ?? 'Bez cílového data'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
