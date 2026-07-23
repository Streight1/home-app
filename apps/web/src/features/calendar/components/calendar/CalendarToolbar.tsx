import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
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
        <Select
          label="Zobrazení"
          value={view}
          onChange={(event) =>
            onViewChange(event.target.value as CalendarViewMode)
          }
          className="min-w-36"
        >
          <option value="month">Měsíc</option>
          <option value="week">Týden</option>
          <option value="day" className="max-md:hidden">
            Den
          </option>
          <option value="agenda">Seznam</option>
        </Select>
      </div>
    </header>
  );
}
