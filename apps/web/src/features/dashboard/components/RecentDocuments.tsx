import { EmptyState } from '../../../components/ui/EmptyState/EmptyState.js';
import type { DashboardListItem } from '../types/dashboard.types.js';
import { DashboardList } from './DashboardList.js';
import { DashboardSection } from './DashboardSection.js';

export function RecentDocuments({
  items,
}: {
  items: readonly DashboardListItem[];
}) {
  return (
    <DashboardSection
      title="Poslední dokumenty"
      className="md:col-span-6 xl:col-span-4"
    >
      {items.length > 0 ? (
        <DashboardList items={items} />
      ) : (
        <EmptyState
          compact
          title="Zatím tu nic není."
          description="Dokumentový modul se připravuje."
        />
      )}
    </DashboardSection>
  );
}
