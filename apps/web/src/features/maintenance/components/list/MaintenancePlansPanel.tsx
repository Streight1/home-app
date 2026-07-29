import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen/LoadingScreen.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type { HouseholdRole } from '../../../household/household.public.js';
import {
  useMaintenanceCategories,
  useMaintenanceMutations,
  useMaintenancePlans,
} from '../../hooks/useMaintenance.js';
import type {
  MaintenanceOccurrence,
  MaintenancePlanFilters,
} from '../../types/maintenance.types.js';
import { MaintenanceOccurrenceDialog } from '../dialogs/MaintenanceOccurrenceDialog.js';
import { MaintenancePlanDetail } from '../detail/MaintenancePlanDetail.js';
import { MaintenancePlanCard } from './MaintenancePlanCard.js';

const defaultFilters: MaintenancePlanFilters = {
  page: 1,
  pageSize: 20,
  sortBy: 'nextDueOn',
  sortDirection: 'asc',
};

export function MaintenancePlansPanel({
  role,
  initialPlanId,
  onCreate,
}: {
  role: HouseholdRole;
  initialPlanId: string | null;
  onCreate: () => void;
}) {
  const [filters, setFilters] =
    useState<MaintenancePlanFilters>(defaultFilters);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    initialPlanId,
  );
  const [occurrenceAction, setOccurrenceAction] = useState<{
    occurrence: MaintenanceOccurrence;
    action: 'complete' | 'skip' | 'reschedule';
  } | null>(null);
  const plans = useMaintenancePlans(filters);
  const categories = useMaintenanceCategories();
  const mutations = useMaintenanceMutations();
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 rounded-lg border border-border bg-surface-raised p-4 md:grid-cols-[minmax(12rem,1fr)_12rem_12rem_auto]">
        <Input
          label="Hledat"
          placeholder="Kotel, filtry, zahrada…"
          value={filters.query ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              query: event.target.value || undefined,
              page: 1,
            }))
          }
        />
        <Select
          label="Stav"
          value={filters.status ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              status: event.target.value
                ? (event.target.value as MaintenancePlanFilters['status'])
                : undefined,
              page: 1,
            }))
          }
        >
          <option value="">Aktivní plány</option>
          <option value="ACTIVE">Aktivní</option>
          <option value="PAUSED">Pozastavené</option>
          <option value="COMPLETED">Dokončené</option>
          <option value="ARCHIVED">Archivované</option>
        </Select>
        <Select
          label="Kategorie"
          value={filters.categoryId ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              categoryId: event.target.value || undefined,
              page: 1,
            }))
          }
        >
          <option value="">Všechny</option>
          {categories.data?.items.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        {role !== 'VIEWER' ? (
          <Button className="self-end" variant="primary" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Přidat plán
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
      {plans.isLoading ? (
        <LoadingScreen embedded message="Načítáme plány údržby…" />
      ) : null}
      {plans.isError ? (
        <InlineAlert variant="danger">
          Plány se nepodařilo načíst. Zkuste to znovu.
        </InlineAlert>
      ) : null}
      {plans.data?.items.length === 0 ? (
        <EmptyState
          eyebrow={<Search className="mx-auto size-6" aria-hidden="true" />}
          title="V tomto pohledu žádný plán není"
          description="Změňte filtry nebo vytvořte první plán údržby."
          action={
            role !== 'VIEWER' ? (
              <Button variant="primary" onClick={onCreate}>
                Přidat plán
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.data?.items.map((plan) => (
          <MaintenancePlanCard
            key={plan.id}
            plan={plan}
            busy={mutations.transitionPlan.isPending}
            onOpen={() => setSelectedPlanId(plan.id)}
            onTransition={(action) =>
              mutations.transitionPlan.mutate({ planId: plan.id, action })
            }
          />
        ))}
      </div>
      {selectedPlanId ? (
        <MaintenancePlanDetail
          planId={selectedPlanId}
          onAction={(occurrence, action) =>
            setOccurrenceAction({ occurrence, action })
          }
        />
      ) : null}
      {occurrenceAction ? (
        <MaintenanceOccurrenceDialog
          occurrence={occurrenceAction.occurrence}
          action={occurrenceAction.action}
          onClose={() => setOccurrenceAction(null)}
        />
      ) : null}
    </div>
  );
}
