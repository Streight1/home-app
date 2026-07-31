import { Clock3 } from 'lucide-react';
import type { RecentSearchItem } from '../types/search.types.js';

export function SearchRecentList({
  items,
  activeId,
  onOpen,
}: {
  items: RecentSearchItem[];
  activeId?: string;
  onOpen: (item: RecentSearchItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section role="group" aria-label="Nedávno otevřené">
      <div
        aria-hidden="true"
        role="presentation"
        className="mb-2 text-caption font-semibold uppercase tracking-wider text-text-muted"
      >
        Nedávno otevřené
      </div>
      <div className="grid gap-1" role="presentation">
        {items.map((item, index) => {
          const id = `recent-${String(index)}`;
          return (
            <button
              key={`${item.openedAt}-${item.title}`}
              id={`search-option-${id}`}
              type="button"
              role="option"
              aria-selected={activeId === id}
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-left focus-visible:outline-2 focus-visible:outline-focus ${activeId === id ? 'bg-selected-surface' : 'hover:bg-surface-hover'}`}
              onClick={() => onOpen(item)}
            >
              <Clock3
                className="size-4 shrink-0 text-text-muted"
                aria-hidden="true"
              />
              <span className="truncate text-body-sm">{item.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
