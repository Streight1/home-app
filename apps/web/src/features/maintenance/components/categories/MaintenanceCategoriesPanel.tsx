import { FolderCog, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen/LoadingScreen.js';
import type { HouseholdRole } from '../../../household/household.public.js';
import {
  useMaintenanceCategories,
  useMaintenanceMutations,
} from '../../hooks/useMaintenance.js';
import { MaintenanceCategoryForm } from './MaintenanceCategoryForm.js';

export function MaintenanceCategoriesPanel({ role }: { role: HouseholdRole }) {
  const categories = useMaintenanceCategories(true);
  const mutations = useMaintenanceMutations();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  if (categories.isLoading)
    return <LoadingScreen embedded message="Načítáme kategorie údržby…" />;
  if (categories.isError)
    return (
      <InlineAlert variant="danger">
        Kategorie údržby se nepodařilo načíst.
      </InlineAlert>
    );
  const canManage = role === 'OWNER' || role === 'ADMIN';
  return (
    <section className="rounded-lg border border-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-section-title font-semibold">Kategorie</h2>
          <p className="mt-1 text-body-sm text-text-muted">
            Kategorie pomáhají oddělit topení, zahradu, bezpečnost nebo IT.
          </p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Nová kategorie
            </Button>
            <Button
              loading={mutations.recommendedCategories.isPending}
              onClick={() => mutations.recommendedCategories.mutate()}
            >
              Vytvořit doporučené kategorie
            </Button>
          </div>
        ) : null}
      </div>
      {creating ? (
        <MaintenanceCategoryForm
          pending={mutations.createCategory.isPending}
          onCancel={() => setCreating(false)}
          onSubmit={(input) =>
            mutations.createCategory.mutate(input, {
              onSuccess: () => setCreating(false),
            })
          }
        />
      ) : null}
      {mutations.recommendedCategories.isError ? (
        <div className="mt-4">
          <InlineAlert variant="danger">
            Doporučené kategorie se nepodařilo vytvořit.
          </InlineAlert>
        </div>
      ) : null}
      {categories.data?.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            compact
            eyebrow={
              <FolderCog className="mx-auto size-6" aria-hidden="true" />
            }
            title="Zatím nemáte kategorie"
            description="Oprávněný správce je může vytvořit výslovnou akcí."
          />
        </div>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.data?.items.map((category) => (
            <li
              key={category.id}
              className="rounded-md border border-border bg-surface p-3"
            >
              <strong>{category.name}</strong>
              {editingId === category.id ? (
                <MaintenanceCategoryForm
                  key={category.id}
                  pending={mutations.updateCategory.isPending}
                  initialValue={category}
                  submitLabel="Uložit kategorii"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(input) =>
                    mutations.updateCategory.mutate(
                      { categoryId: category.id, input },
                      { onSuccess: () => setEditingId(null) },
                    )
                  }
                />
              ) : null}
              {category.archivedAt ? (
                <p className="text-caption text-text-muted">Archivováno</p>
              ) : canManage ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(category.id)}
                  >
                    Upravit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={
                      mutations.archiveCategory.isPending &&
                      mutations.archiveCategory.variables === category.id
                    }
                    onClick={() =>
                      mutations.archiveCategory.mutate(category.id)
                    }
                  >
                    Archivovat
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
