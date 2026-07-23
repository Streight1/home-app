import { useState } from 'react';
import { Archive, FolderTree, Pencil, Plus, Sparkles } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import {
  useFinancialCategories,
  useFinanceMutations,
} from '../../hooks/useFinance.js';
import type { FinancialCategory } from '../../types/finance.types.js';
import { FinancialCategoryDialog } from '../forms/FinancialCategoryDialog.js';
import { RecommendedCategoriesDialog } from '../forms/RecommendedCategoriesDialog.js';

export function FinancialCategoriesPanel({
  canManage,
  onAdd,
}: {
  canManage: boolean;
  onAdd: () => void;
}) {
  const [editing, setEditing] = useState<FinancialCategory | null>(null);
  const [recommendedOpen, setRecommendedOpen] = useState(false);
  const categories = useFinancialCategories(true);
  const mutations = useFinanceMutations();
  const recommended = mutations.recommendedCategories;
  if (categories.isPending)
    return (
      <p className="text-body-sm text-text-muted" role="status">
        Načítáme kategorie…
      </p>
    );
  if (categories.isError)
    return (
      <InlineAlert variant="danger">
        Kategorie se nepodařilo načíst.{' '}
        <button
          type="button"
          className="min-h-11 px-2 underline"
          onClick={() => void categories.refetch()}
        >
          Zkusit znovu
        </button>
      </InlineAlert>
    );
  if (categories.data.items.length === 0)
    return (
      <>
        <EmptyState
          eyebrow={<FolderTree className="mx-auto size-5" aria-hidden="true" />}
          title="Kategorie jsou zatím prázdné"
          description="Vytvořte vlastní kategorie nebo si nechte založit upravitelnou doporučenou sadu."
          action={
            canManage ? (
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="primary" onClick={onAdd}>
                  <Plus className="size-4" aria-hidden="true" />
                  Nová kategorie
                </Button>
                <Button
                  loading={recommended.isPending}
                  onClick={() => setRecommendedOpen(true)}
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  Vytvořit doporučené
                </Button>
              </div>
            ) : undefined
          }
        />
        <RecommendedCategoriesDialog
          open={recommendedOpen}
          loading={recommended.isPending}
          onOpenChange={setRecommendedOpen}
          onConfirm={() =>
            recommended.mutate(undefined, {
              onSuccess: () => setRecommendedOpen(false),
            })
          }
        />
      </>
    );
  const roots = categories.data.items.filter((category) => !category.parentId);
  return (
    <div className="grid gap-4">
      {canManage ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={onAdd}>
            Nová kategorie
          </Button>
          <Button
            loading={recommended.isPending}
            onClick={() => setRecommendedOpen(true)}
          >
            Doplnit doporučené
          </Button>
        </div>
      ) : null}
      <ul className="grid gap-3">
        {roots.map((root) => (
          <li
            key={root.id}
            className={`rounded-lg border border-border bg-surface-raised p-4 ${root.archivedAt ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-semibold">{root.name}</span>
                <p className="text-caption text-text-muted">
                  {root.kind}
                  {root.archivedAt ? ' · Archivovaná' : ''}
                </p>
              </div>
              {canManage && !root.archivedAt ? (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    aria-label={`Upravit kategorii ${root.name}`}
                    onClick={() => setEditing(root)}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Archivovat kategorii ${root.name}`}
                    loading={
                      mutations.archiveCategory.isPending &&
                      mutations.archiveCategory.variables === root.id
                    }
                    onClick={() => mutations.archiveCategory.mutate(root.id)}
                  >
                    <Archive className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : null}
            </div>
            <ul className="mt-2 border-l border-border pl-4 text-body-sm text-text-muted">
              {categories.data.items
                .filter((category) => category.parentId === root.id)
                .map((child) => (
                  <li
                    key={child.id}
                    className="flex min-h-11 items-center justify-between gap-2 py-1"
                  >
                    <span>
                      {child.name}
                      {child.archivedAt ? ' · Archivovaná' : ''}
                    </span>
                    {canManage && !child.archivedAt ? (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          aria-label={`Upravit kategorii ${child.name}`}
                          onClick={() => setEditing(child)}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label={`Archivovat kategorii ${child.name}`}
                          onClick={() =>
                            mutations.archiveCategory.mutate(child.id)
                          }
                        >
                          <Archive className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ul>
      {editing ? (
        <FinancialCategoryDialog
          key={editing.id}
          open
          category={editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
      <RecommendedCategoriesDialog
        open={recommendedOpen}
        loading={recommended.isPending}
        onOpenChange={setRecommendedOpen}
        onConfirm={() =>
          recommended.mutate(undefined, {
            onSuccess: () => setRecommendedOpen(false),
          })
        }
      />
    </div>
  );
}
