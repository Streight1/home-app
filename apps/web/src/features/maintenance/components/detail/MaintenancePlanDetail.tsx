import { Check, ListPlus, Pencil, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen/LoadingScreen.js';
import {
  useMaintenanceMutations,
  useMaintenanceOccurrences,
  useMaintenancePlan,
} from '../../hooks/useMaintenance.js';
import {
  formatMaintenanceDate,
  maintenanceOccurrenceStatusLabels,
} from '../../lib/maintenanceFormat.js';
import type { MaintenanceOccurrence } from '../../types/maintenance.types.js';
import { MaintenancePlanDialog } from '../dialogs/MaintenancePlanDialog.js';

export function MaintenancePlanDetail({
  planId,
  onAction,
}: {
  planId: string;
  onAction: (
    occurrence: MaintenanceOccurrence,
    action: 'complete' | 'skip' | 'reschedule',
  ) => void;
}) {
  const plan = useMaintenancePlan(planId);
  const occurrences = useMaintenanceOccurrences({
    planId,
    page: 1,
    pageSize: 50,
  });
  const mutations = useMaintenanceMutations();
  const [editing, setEditing] = useState(false);
  if (plan.isLoading || occurrences.isLoading)
    return <LoadingScreen embedded message="Načítáme detail údržby…" />;
  if (plan.isError || occurrences.isError)
    return (
      <InlineAlert variant="danger">
        Detail plánu se nepodařilo načíst.
      </InlineAlert>
    );
  if (!plan.data) return null;
  return (
    <section className="grid gap-4 rounded-lg border border-border bg-surface-raised p-5">
      <div>
        <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
          Detail plánu
        </p>
        <h2 className="mt-1 text-section-title font-semibold">
          {plan.data.title}
        </h2>
        {plan.data.description ? (
          <p className="mt-2 text-body-sm text-text-muted">
            {plan.data.description}
          </p>
        ) : null}
        {plan.data.permissions.canEdit ? (
          <Button className="mt-3" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-4" aria-hidden="true" />
            Upravit plán
          </Button>
        ) : null}
      </div>
      {plan.data.instructions ? (
        <div>
          <h3 className="text-body-sm font-semibold">Pokyny</h3>
          <p className="mt-1 whitespace-pre-wrap text-body-sm text-text-muted">
            {plan.data.instructions}
          </p>
        </div>
      ) : null}
      <div>
        <h3 className="text-body-sm font-semibold">Výskyty a historie</h3>
        {occurrences.data?.items.length === 0 ? (
          <EmptyState
            compact
            title="Žádný výskyt"
            description="Generátor zatím pro tento plán nevytvořil termín."
          />
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {occurrences.data?.items.map((occurrence) => {
              const mutable = occurrence.permissions.canMutate;
              return (
                <li
                  key={occurrence.id}
                  className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div>
                    <strong>
                      {formatMaintenanceDate(occurrence.scheduledFor)}
                    </strong>
                    <p className="text-caption text-text-muted">
                      {maintenanceOccurrenceStatusLabels[occurrence.status]}
                      {occurrence.completedOn
                        ? ` · provedeno ${formatMaintenanceDate(occurrence.completedOn)}`
                        : ''}
                    </p>
                  </div>
                  {mutable ? (
                    <div className="flex flex-wrap gap-2">
                      {!occurrence.taskId ? (
                        <Button
                          size="sm"
                          loading={
                            mutations.createTask.isPending &&
                            mutations.createTask.variables === occurrence.id
                          }
                          onClick={() =>
                            mutations.createTask.mutate(occurrence.id)
                          }
                        >
                          <ListPlus className="size-4" aria-hidden="true" />
                          Vytvořit úkol
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => onAction(occurrence, 'complete')}
                      >
                        <Check className="size-4" aria-hidden="true" />
                        Dokončit
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onAction(occurrence, 'reschedule')}
                      >
                        Přeplánovat
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAction(occurrence, 'skip')}
                      >
                        <SkipForward className="size-4" aria-hidden="true" />
                        Přeskočit
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <MaintenancePlanDialog
        open={editing}
        onOpenChange={setEditing}
        plan={plan.data}
      />
    </section>
  );
}
