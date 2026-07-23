import { CalendarDays } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState.js';
import type { DashboardListItem } from '../types/dashboard.types.js';
import { DashboardList } from './DashboardList.js';
import { DashboardSection } from './DashboardSection.js';

export function AgendaPanel({
  items,
}: {
  items: readonly DashboardListItem[];
}) {
  return (
    <DashboardSection
      title="Dnešní úkoly"
      description="Úkoly a události pro dnešek."
      className="md:col-span-12"
      action={
        <CalendarDays className="size-5 text-text-muted" aria-hidden="true" />
      }
    >
      {items.length > 0 ? (
        <DashboardList items={items} />
      ) : (
        <EmptyState
          compact
          title="Úkoly jsou zatím prázdné."
          description="Kalendář a úkoly zpřístupníme v dalších modulech."
        />
      )}
    </DashboardSection>
  );
}
