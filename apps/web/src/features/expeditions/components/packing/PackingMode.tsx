import { AlertTriangle, Check, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import {
  useExpeditionMutations,
  useTripWeightSummary,
} from '../../hooks/useExpeditions.js';
import {
  CRITICALITY_LABELS,
  formatWeight,
  LOAD_TYPE_LABELS,
  PACKING_STATUS_LABELS,
} from '../../lib/expeditionLabels.js';
import type { Trip } from '../../types/expeditions.types.js';
import { PackingBulkActions } from './PackingBulkActions.js';

type Filter = 'all' | 'unpacked' | 'missing' | 'required' | 'consumable';

export function PackingMode({
  trip,
  canWrite,
}: {
  trip: Trip;
  canWrite: boolean;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const mutations = useExpeditionMutations();
  const summary = useTripWeightSummary(trip.id);
  const visible = trip.items.filter((item) => {
    if (filter === 'unpacked') return item.packingStatus === 'PLANNED';
    if (filter === 'missing') return item.packingStatus === 'MISSING';
    if (filter === 'required') return item.criticality === 'REQUIRED';
    if (filter === 'consumable') return item.loadType === 'CONSUMABLE';
    return true;
  });
  const packed = trip.items.filter(
    ({ packingStatus }) => packingStatus === 'PACKED',
  );
  const packedWeight = summary.data?.packedWeightGrams ?? 0;
  const totalWeight = summary.data?.totalPlannedWeightGrams ?? 0;
  const filters: [Filter, string][] = [
    ['all', 'Vše'],
    ['unpacked', 'Nesbaleno'],
    ['missing', 'Chybí'],
    ['required', 'Povinné'],
    ['consumable', 'Spotřební'],
  ];
  const categoryLeaderIds = new Set<string>();
  const seenCategories = new Set<string>();
  for (const item of visible) {
    if (!item.categoryName || seenCategories.has(item.categoryName)) continue;
    seenCategories.add(item.categoryName);
    categoryLeaderIds.add(item.id);
  }
  return (
    <section className="grid gap-4" aria-labelledby="packing-mode-title">
      <div>
        <h3
          id="packing-mode-title"
          className="text-section-title font-semibold"
        >
          Režim Balit
        </h3>
        <p className="text-body-sm text-text-muted" aria-live="polite">
          {packed.length} z {trip.items.length} položek · sbaleno{' '}
          {formatWeight(packedWeight)} z {formatWeight(totalWeight)}
        </p>
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrovat seznam balení"
      >
        {filters.map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? 'primary' : 'secondary'}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      {canWrite ? (
        <PackingBulkActions
          trip={trip}
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
        />
      ) : null}
      {mutations.packing.error ? (
        <InlineAlert variant="danger">
          Změnu se nepodařilo uložit. Původní stav byl obnoven.
        </InlineAlert>
      ) : null}
      <div className="grid gap-3">
        {visible.map((item) => {
          const checked = item.packingStatus === 'PACKED';
          return (
            <article
              key={item.id}
              className={`rounded-lg border p-3 ${item.packingStatus === 'MISSING' ? 'border-warning bg-warning-soft' : 'border-border bg-surface-raised'}`}
            >
              <div className="flex min-w-0 items-start gap-3">
                {canWrite ? (
                  <label className="grid min-h-11 shrink-0 place-items-center">
                    <span className="sr-only">Vybrat položku {item.name}</span>
                    <input
                      type="checkbox"
                      className="size-5"
                      checked={selectedIds.includes(item.id)}
                      onChange={(event) =>
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, item.id]
                            : current.filter((id) => id !== item.id),
                        )
                      }
                    />
                  </label>
                ) : null}
                <label className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-input">
                  <span className="sr-only">
                    {checked
                      ? 'Označit jako nesbalené'
                      : 'Označit jako sbalené'}
                    : {item.name}
                  </span>
                  <input
                    className="size-6"
                    type="checkbox"
                    checked={checked}
                    disabled={!canWrite || mutations.packing.isPending}
                    onChange={(event) =>
                      mutations.packing.mutate({
                        tripId: trip.id,
                        itemIds: [item.id],
                        status: event.target.checked ? 'PACKED' : 'PLANNED',
                      })
                    }
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{item.name}</strong>
                    {checked ? (
                      <Check
                        className="size-4 text-success"
                        aria-hidden="true"
                      />
                    ) : null}
                    {item.packingStatus === 'MISSING' ? (
                      <AlertTriangle
                        className="size-4 text-warning"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  <p className="text-caption text-text-muted">
                    {item.quantity} × {formatWeight(item.unitWeightGrams)}
                    {item.categoryName ? ` · ${item.categoryName}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge>{PACKING_STATUS_LABELS[item.packingStatus]}</Badge>
                    <Badge>{CRITICALITY_LABELS[item.criticality]}</Badge>
                    <Badge>{LOAD_TYPE_LABELS[item.loadType]}</Badge>
                    {item.isShared && !item.assignedUserId ? (
                      <Badge variant="warning">Chybí nositel</Badge>
                    ) : null}
                  </div>
                  {canWrite &&
                  item.categoryName &&
                  categoryLeaderIds.has(item.id) ? (
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="ghost"
                      loading={mutations.packing.isPending}
                      onClick={() =>
                        mutations.packing.mutate({
                          tripId: trip.id,
                          itemIds: trip.items
                            .filter(
                              (candidate) =>
                                candidate.categoryName === item.categoryName &&
                                candidate.packingStatus !== 'EXCLUDED',
                            )
                            .map(({ id }) => id),
                          status: 'PACKED',
                        })
                      }
                    >
                      Sbalit kategorii {item.categoryName}
                    </Button>
                  ) : null}
                </div>
                {canWrite && item.packingStatus !== 'MISSING' ? (
                  <Button
                    type="button"
                    onClick={() =>
                      mutations.packing.mutate({
                        tripId: trip.id,
                        itemIds: [item.id],
                        status: 'MISSING',
                      })
                    }
                  >
                    Chybí
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
        {visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-body-sm text-text-muted">
            <PackageCheck className="mx-auto mb-2 size-6" aria-hidden="true" />
            Filtru neodpovídá žádná položka.
          </div>
        ) : null}
      </div>
    </section>
  );
}
