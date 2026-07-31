import { Backpack, Plus, Scale } from 'lucide-react';
import { useEffect } from 'react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import {
  useExpeditionMutations,
  useGear,
  useGearCategories,
} from '../../hooks/useExpeditions.js';
import {
  CRITICALITY_LABELS,
  formatWeight,
  LOAD_TYPE_LABELS,
} from '../../lib/expeditionLabels.js';
import type { GearItem } from '../../types/expeditions.types.js';

function gearSecondaryLabel(item: GearItem) {
  const identity = [item.brand, item.model].filter(Boolean).join(' · ');
  if (identity) return identity;
  return item.category?.name ?? 'Bez kategorie';
}

export function GearCatalogPanel({
  canWrite,
  canManageCategories,
  selectedGearItemId,
}: {
  canWrite: boolean;
  canManageCategories: boolean;
  selectedGearItemId?: string;
}) {
  const workspace = useWorkspaceNavigation();
  const gear = useGear({ page: 1, pageSize: 50 });
  const categories = useGearCategories();
  const mutations = useExpeditionMutations();
  useEffect(() => {
    if (!selectedGearItemId) return;
    const target = document.getElementById(
      `gear-search-target-${selectedGearItemId}`,
    );
    target?.scrollIntoView({ block: 'center' });
    target?.focus({ preventScroll: true });
  }, [gear.data, selectedGearItemId]);
  return (
    <section className="grid gap-4" aria-labelledby="gear-catalog-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="gear-catalog-title"
            className="text-section-title font-semibold"
          >
            Katalog výbavy
          </h2>
          <p className="text-body-sm text-text-muted">
            Hmotnosti jsou uložené v gramech; neověřené položky jsou výslovně
            označené.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageCategories && categories.data?.length === 0 ? (
            <Button
              loading={mutations.recommendedCategories.isPending}
              onClick={() => mutations.recommendedCategories.mutate()}
            >
              Doporučené kategorie
            </Button>
          ) : null}
          {canWrite ? (
            <Button
              variant="primary"
              onClick={() =>
                workspace.openOverlay({ kind: 'gear-item-create' })
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Nová položka výbavy
            </Button>
          ) : null}
        </div>
      </div>
      {gear.isLoading ? (
        <p className="text-body-sm text-text-muted">Načítáme výbavu…</p>
      ) : null}
      {gear.isError ? (
        <InlineAlert variant="danger">
          Výbavu se nepodařilo načíst.
          <button
            type="button"
            className="ml-2 min-h-11 underline"
            onClick={() => void gear.refetch()}
          >
            Zkusit znovu
          </button>
        </InlineAlert>
      ) : null}
      {gear.data?.items.length === 0 ? (
        <EmptyState
          eyebrow={<Backpack className="mx-auto size-6" aria-hidden="true" />}
          title="Katalog výbavy je prázdný"
          description="Začněte věcmi, které skutečně vlastníte; později je vložíte do opakovaně použitelných gearlistů."
          action={
            canWrite ? (
              <Button
                onClick={() =>
                  workspace.openOverlay({ kind: 'gear-item-create' })
                }
              >
                Přidat první položku
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {gear.data?.items.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {gear.data.items.map((item) => (
            <article
              key={item.id}
              id={`gear-search-target-${item.id}`}
              tabIndex={-1}
              aria-current={selectedGearItemId === item.id ? 'true' : undefined}
              className={`rounded-lg border bg-surface-raised p-4 shadow-sm focus-visible:outline-2 focus-visible:outline-focus ${selectedGearItemId === item.id ? 'border-focus bg-selected-surface' : 'border-border'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-caption text-text-muted">
                    {gearSecondaryLabel(item)}
                  </p>
                </div>
                <Scale
                  className="size-5 text-primary-emphasis"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 text-page-title font-semibold">
                {formatWeight(item.weightGrams)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  variant={
                    item.weightStatus === 'UNKNOWN' ? 'warning' : 'success'
                  }
                >
                  {item.weightStatus === 'VERIFIED'
                    ? 'Ověřeno'
                    : item.weightStatus === 'ESTIMATED'
                      ? 'Odhad'
                      : 'Neznámá hmotnost'}
                </Badge>
                <Badge>{LOAD_TYPE_LABELS[item.defaultLoadType]}</Badge>
                <Badge>{CRITICALITY_LABELS[item.defaultCriticality]}</Badge>
              </div>
              {item.coverDocumentId ? (
                <p className="mt-3 text-caption text-text-muted">
                  Titulní fotografie je bezpečně uložená v Dokumentech.
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
