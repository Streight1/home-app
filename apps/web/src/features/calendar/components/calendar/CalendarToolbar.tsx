import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  CheckSquare2,
  X,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { calendarPeriodLabel } from '../../lib/calendarDate.js';
import type { CalendarViewMode } from '../../types/calendar.types.js';

export function CalendarToolbar({
  date,
  view,
  canMutate,
  onViewChange,
  onToday,
  onPrevious,
  onNext,
  onCreate,
  onTemplates,
  selectionMode = false,
  onSelectionModeChange = () => undefined,
}: {
  date: Date;
  view: CalendarViewMode;
  canMutate: boolean;
  onViewChange: (view: CalendarViewMode) => void;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onCreate: () => void;
  onTemplates: () => void;
  selectionMode?: boolean | undefined;
  onSelectionModeChange?: ((active: boolean) => void) | undefined;
}) {
  return (
    <header className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wide text-primary-emphasis">
            Společná domácnost
          </p>
          <h1 className="mt-1 text-page-title font-semibold">Kalendář</h1>
          <p className="mt-1 text-body-sm text-text-muted">
            Události, směny a termíny úkolů na jednom místě.
          </p>
        </div>
        {canMutate ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onTemplates}>
              <LayoutTemplate className="size-4" aria-hidden="true" />
              Šablony
            </Button>
            <Button
              variant="secondary"
              aria-pressed={selectionMode}
              onClick={() => onSelectionModeChange(!selectionMode)}
            >
              {selectionMode ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <CheckSquare2 className="size-4" aria-hidden="true" />
              )}
              {selectionMode ? 'Ukončit výběr' : 'Vybrat'}
            </Button>
            <Button variant="primary" onClick={onCreate}>
              <CalendarPlus className="size-4" aria-hidden="true" />
              Nová událost
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border bg-surface-raised p-3">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onToday}>
            Dnes
          </Button>
          <IconButton
            aria-label="Předchozí období"
            variant="ghost"
            onClick={onPrevious}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </IconButton>
          <IconButton
            aria-label="Následující období"
            variant="ghost"
            onClick={onNext}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </IconButton>
          <h2 className="min-w-0 text-section-title font-semibold capitalize">
            {calendarPeriodLabel(date, view)}
          </h2>
        </div>
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <div
            className="grid grid-cols-3 rounded-md border border-border bg-surface-subtle p-1"
            aria-label="Zobrazení kalendáře"
          >
            {(
              [
                ['day', 'Den'],
                ['week', 'Týden'],
                ['month', 'Měsíc'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => onViewChange(value)}
                className={`min-h-11 rounded-sm px-3 text-body-sm font-medium focus-visible:outline-2 focus-visible:outline-focus ${view === value ? 'bg-selected text-text shadow-sm' : 'text-text-muted hover:bg-surface-hover'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <Select
            label="Další zobrazení"
            value={view === 'agenda' ? 'agenda' : ''}
            onChange={(event) => {
              if (event.target.value)
                onViewChange(event.target.value as CalendarViewMode);
            }}
            className="min-w-32"
          >
            <option value="">—</option>
            <option value="agenda">Seznam</option>
          </Select>
        </div>
      </div>
    </header>
  );
}
