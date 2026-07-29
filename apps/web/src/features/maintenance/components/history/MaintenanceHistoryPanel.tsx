import { History } from 'lucide-react';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen/LoadingScreen.js';
import { formatMinorUnits } from '../../../finance/finance.public.js';
import { useMaintenanceOccurrences } from '../../hooks/useMaintenance.js';
import {
  formatMaintenanceDate,
  maintenanceOccurrenceStatusLabels,
} from '../../lib/maintenanceFormat.js';

export function MaintenanceHistoryPanel() {
  const history = useMaintenanceOccurrences({
    history: true,
    page: 1,
    pageSize: 100,
  });
  if (history.isLoading)
    return <LoadingScreen embedded message="Načítáme historii údržby…" />;
  if (history.isError)
    return (
      <InlineAlert variant="danger">
        Historii údržby se nepodařilo načíst.
      </InlineAlert>
    );
  const items =
    history.data?.items.filter((item) =>
      ['COMPLETED', 'SKIPPED', 'CANCELLED'].includes(item.status),
    ) ?? [];
  if (!items.length)
    return (
      <EmptyState
        eyebrow={<History className="mx-auto size-6" aria-hidden="true" />}
        title="Historie je zatím prázdná"
        description="Dokončené, přeskočené a zrušené výskyty se uloží zde."
      />
    );
  return (
    <section className="rounded-lg border border-border bg-surface-raised p-5">
      <h2 className="text-section-title font-semibold">Historie provedení</h2>
      <ul className="mt-3 divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="grid gap-2 py-4 sm:grid-cols-3">
            <div>
              <strong>{item.plan.title}</strong>
              <p className="text-caption text-text-muted">
                {maintenanceOccurrenceStatusLabels[item.status]}
              </p>
            </div>
            <div>
              <p className="text-caption text-text-muted">Plánovaný termín</p>
              <p>{formatMaintenanceDate(item.originalScheduledFor)}</p>
            </div>
            <div>
              <p className="text-caption text-text-muted">
                Provedeno / náklady
              </p>
              <p>
                {item.completedOn
                  ? formatMaintenanceDate(item.completedOn)
                  : 'Neprovedeno'}
                {item.actualCost
                  ? ` · ${formatMinorUnits(
                      item.actualCost.amountMinor,
                      item.actualCost.currencyCode as 'CZK' | 'EUR',
                    )}`
                  : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
