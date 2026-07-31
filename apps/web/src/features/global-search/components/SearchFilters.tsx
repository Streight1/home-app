import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button.js';
import { Sheet } from '../../../components/ui/Sheet/Sheet.js';
import type { SearchFilterKey } from '../types/search.types.js';

export const searchFilters: { key: SearchFilterKey; label: string }[] = [
  { key: 'all', label: 'Vše' },
  { key: 'documents', label: 'Dokumenty' },
  { key: 'tasks', label: 'Úkoly a údržba' },
  { key: 'calendar', label: 'Kalendář' },
  { key: 'finance', label: 'Finance' },
  { key: 'meals', label: 'Recepty a jídlo' },
  { key: 'expeditions', label: 'Výpravy a výbava' },
  { key: 'other', label: 'Ostatní' },
];

function FilterButtons({
  selected,
  onSelect,
}: {
  selected: SearchFilterKey;
  onSelect: (filter: SearchFilterKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Filtrovat hledání">
      {searchFilters.map((filter) => (
        <Button
          key={filter.key}
          type="button"
          variant={selected === filter.key ? 'primary' : 'secondary'}
          aria-pressed={selected === filter.key}
          className="min-h-10 px-3 py-2 text-caption"
          onClick={() => onSelect(filter.key)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

export function SearchFilters(props: {
  selected: SearchFilterKey;
  onSelect: (filter: SearchFilterKey) => void;
}) {
  const selectedLabel =
    searchFilters.find((filter) => filter.key === props.selected)?.label ??
    'Vše';
  return (
    <>
      <div className="hidden sm:block">
        <FilterButtons {...props} />
      </div>
      <div className="sm:hidden">
        <Sheet
          side="bottom"
          title="Oblast hledání"
          description="Vyberte, ve kterých částech aplikace chcete hledat."
          trigger={
            <Button variant="secondary" className="w-full justify-between">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                Oblast
              </span>
              <span>{selectedLabel}</span>
            </Button>
          }
        >
          <FilterButtons {...props} />
        </Sheet>
      </div>
    </>
  );
}
