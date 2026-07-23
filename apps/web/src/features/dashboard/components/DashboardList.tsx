import type { DashboardListItem } from '../types/dashboard.types.js';

export function DashboardList({
  items,
}: {
  items: readonly DashboardListItem[];
}) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="py-3 first:pt-0 last:pb-0">
          <p className="text-body-sm font-medium text-text">{item.title}</p>
          <p className="mt-1 text-caption text-text-muted">{item.meta}</p>
        </li>
      ))}
    </ul>
  );
}
