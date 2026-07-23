import { EmptyState } from '../../../components/ui/EmptyState/EmptyState.js';
import type { DashboardListItem } from '../types/dashboard.types.js';
import { DashboardList } from './DashboardList.js';
import { DashboardSection } from './DashboardSection.js';

export function UpcomingDeadlines({
  items,
}: {
  items: readonly DashboardListItem[];
}) {
  return (
    <DashboardSection
      title="Nadcházející termíny"
      className="md:col-span-12 xl:col-span-4"
    >
      {items.length > 0 ? (
        <DashboardList items={items} />
      ) : (
        <EmptyState
          compact
          title="Žádné známé termíny."
          description="Termíny se zobrazí po přidání úkolů."
        />
      )}
    </DashboardSection>
  );
}
