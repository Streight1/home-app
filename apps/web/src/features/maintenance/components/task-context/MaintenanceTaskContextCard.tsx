import { Wrench } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Card } from '../../../../components/ui/Card/Card.js';
import { useMaintenanceTaskContext } from '../../hooks/useMaintenance.js';
import { formatMaintenanceDate } from '../../lib/maintenanceFormat.js';

export function MaintenanceTaskContextCard({
  taskId,
  taskCompleted,
}: {
  taskId: string;
  taskCompleted: boolean;
}) {
  const context = useMaintenanceTaskContext(taskId);
  const workspace = useWorkspaceNavigation();
  if (!context.data || context.isError) return null;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wide text-primary-emphasis">
            <Wrench className="size-4" aria-hidden="true" />
            Plán údržby
          </p>
          <h2 className="mt-1 text-section-title font-semibold">
            {context.data.planTitle}
          </h2>
          <p className="mt-1 text-body-sm text-text-muted">
            Termín {formatMaintenanceDate(context.data.scheduledFor)}
          </p>
          {taskCompleted && context.data.permissions.canComplete ? (
            <p className="mt-2 text-body-sm text-text-secondary">
              Úkol je splněný. Doplňte cenu, dodavatele nebo dokumenty a
              potvrďte záznam údržby.
            </p>
          ) : null}
        </div>
        <Button
          variant={taskCompleted ? 'primary' : 'secondary'}
          onClick={() => workspace.navigate(context.data.navigationTarget)}
        >
          {taskCompleted && context.data.permissions.canComplete
            ? 'Dokončit záznam údržby'
            : 'Zobrazit plán údržby'}
        </Button>
      </div>
    </Card>
  );
}
