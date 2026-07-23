import { Filter, Plus } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import type { TaskView } from '../../types/task.types.js';

const views: { value: TaskView; label: string }[] = [
  { value: 'all', label: 'Vše' },
  { value: 'today', label: 'Dnes' },
  { value: 'upcoming', label: 'Nadcházející' },
  { value: 'overdue', label: 'Po termínu' },
  { value: 'completed', label: 'Dokončené' },
];

export function TasksToolbar({
  view,
  query,
  canCreate,
  onViewChange,
  onQueryChange,
  onCreate,
  onFilters,
}: {
  view: TaskView;
  query: string;
  canCreate: boolean;
  onViewChange: (view: TaskView) => void;
  onQueryChange: (query: string) => void;
  onCreate: () => void;
  onFilters: () => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
            Domácí přehled
          </p>
          <h1 className="mt-1 text-page-title font-semibold tracking-tight">
            Úkoly
          </h1>
          <p className="mt-1 text-body-sm text-text-muted">
            Úkoly, povinnosti a termíny vaší domácnosti.
          </p>
        </div>
        {canCreate ? (
          <Button variant="primary" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Nový úkol
          </Button>
        ) : null}
      </div>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Pohled úkolů"
      >
        {views.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={view === item.value}
            className={`min-h-11 shrink-0 rounded-md border px-4 text-body-sm font-medium focus-visible:outline-2 focus-visible:outline-focus ${view === item.value ? 'border-primary bg-primary-soft text-primary-emphasis' : 'border-border bg-surface text-text-muted hover:bg-surface-hover'}`}
            onClick={() => onViewChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          label="Hledat úkol"
          value={query}
          placeholder="Název nebo popis"
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <Button className="sm:self-end" onClick={onFilters}>
          <Filter className="size-4" aria-hidden="true" />
          Filtry
        </Button>
      </div>
    </div>
  );
}
