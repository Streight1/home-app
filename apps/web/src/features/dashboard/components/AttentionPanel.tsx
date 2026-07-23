import { CircleCheck, CircleDot } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState.js';
import type { DashboardListItem } from '../types/dashboard.types.js';
import { DashboardList } from './DashboardList.js';
import { DashboardSection } from './DashboardSection.js';

export function AttentionPanel({
  items,
}: {
  items: readonly DashboardListItem[];
}) {
  return (
    <DashboardSection
      title="Vyžaduje pozornost"
      description="Důležité věci na jednom místě."
      className="md:col-span-7 xl:col-span-8"
      action={
        <CircleDot
          className="size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
      }
    >
      {items.length > 0 ? (
        <DashboardList items={items} />
      ) : (
        <EmptyState
          compact
          eyebrow={
            <CircleCheck
              className="mx-auto size-6 text-success"
              aria-hidden="true"
            />
          }
          title="Zatím tu nic není."
          description="Jakmile přibudou data z jednotlivých oblastí, důležité položky se zobrazí tady."
        />
      )}
    </DashboardSection>
  );
}
