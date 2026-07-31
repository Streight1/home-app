import {
  Backpack,
  CalendarDays,
  FileText,
  ListTodo,
  Mountain,
  ReceiptText,
  Search,
  ShoppingBasket,
  Soup,
  Utensils,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge/Badge.js';
import type {
  ApplicationSearchResponse,
  ApplicationSearchResult,
} from '../types/search.types.js';

const icons: Record<string, LucideIcon> = {
  document: FileText,
  task: ListTodo,
  maintenance: Wrench,
  calendar: CalendarDays,
  finance: ReceiptText,
  recipe: Utensils,
  'meal-plan': Soup,
  'shopping-basket': ShoppingBasket,
  pantry: Soup,
  mountain: Mountain,
  backpack: Backpack,
};

export function SearchResultList({
  response,
  activeId,
  onOpen,
  onShowGroup,
}: {
  response: ApplicationSearchResponse;
  activeId?: string;
  onOpen: (result: ApplicationSearchResult) => void;
  onShowGroup: (groupKey: string) => void;
}) {
  return (
    <div className="grid gap-5" role="presentation">
      {response.groups.map((group) => (
        <section
          key={group.key}
          role="group"
          aria-label={`${group.label}, počet výsledků: ${String(group.total)}`}
        >
          <div
            className="mb-2 flex items-center justify-between gap-3"
            role="presentation"
          >
            <div
              aria-hidden="true"
              role="presentation"
              className="text-caption font-semibold uppercase tracking-wider text-text-muted"
            >
              {group.label}
            </div>
            <span aria-hidden="true" className="text-caption text-text-subtle">
              {group.total}
            </span>
          </div>
          <div className="grid gap-1" role="presentation">
            {group.items.map((result) => {
              const Icon = icons[result.iconKey] ?? Search;
              return (
                <button
                  key={result.resultId}
                  id={`search-option-${result.resultId}`}
                  type="button"
                  role="option"
                  aria-selected={activeId === result.resultId}
                  className={`flex min-h-14 w-full items-start gap-3 rounded-md px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-focus ${activeId === result.resultId ? 'bg-selected-surface' : 'hover:bg-surface-hover'}`}
                  onClick={() => onOpen(result)}
                >
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-body-sm">{result.title}</strong>
                      {result.badges?.slice(0, 1).map((badge) => (
                        <Badge key={badge.label}>{badge.label}</Badge>
                      ))}
                    </span>
                    {result.subtitle ? (
                      <span className="block truncate text-caption text-text-muted">
                        {result.subtitle}
                      </span>
                    ) : null}
                    {result.snippet ? (
                      <span className="mt-1 line-clamp-2 block text-caption text-text-muted">
                        {result.snippet}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-caption text-text-subtle">
                      Shoda: {result.matchedField}
                      {result.dateLabel ? ` · ${result.dateLabel}` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {group.total > group.items.length ? (
            <button
              id={`search-option-show-group-${group.key}`}
              type="button"
              role="option"
              aria-selected={activeId === `show-group-${group.key}`}
              className={`mt-2 min-h-11 rounded-md px-3 text-body-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-focus ${activeId === `show-group-${group.key}` ? 'bg-selected-surface' : 'hover:bg-surface-hover'}`}
              onClick={() => onShowGroup(group.key)}
            >
              Zobrazit vše v oblasti {group.label}
            </button>
          ) : null}
        </section>
      ))}
    </div>
  );
}
