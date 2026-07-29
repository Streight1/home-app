import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button.js';
import type { HouseholdRole } from '../../household/household.public.js';
import { MaintenanceCategoriesPanel } from '../components/categories/MaintenanceCategoriesPanel.js';
import { MaintenanceHistoryPanel } from '../components/history/MaintenanceHistoryPanel.js';
import { MaintenancePlansPanel } from '../components/list/MaintenancePlansPanel.js';
import { MaintenanceOverviewPanel } from '../components/overview/MaintenanceOverviewPanel.js';

export type MaintenanceScreen = 'overview' | 'plans' | 'history' | 'categories';

export function MaintenancePage({
  role,
  screen,
  initialPlanId = null,
  onScreenChange,
  onCreate,
}: {
  role: HouseholdRole;
  screen: MaintenanceScreen;
  initialPlanId?: string | null;
  onScreenChange: (screen: MaintenanceScreen) => void;
  onCreate: () => void;
}) {
  return (
    <div className="grid gap-5">
      <header className="aurora-header-surface rounded-lg border border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              Péče a servis
            </p>
            <h1 className="mt-1 text-page-title font-semibold">
              Údržba domácnosti
            </h1>
            <p className="mt-2 max-w-2xl text-body-sm text-text-muted">
              Plány, konkrétní termíny, navázané úkoly a doložitelná historie
              provedení.
            </p>
          </div>
          {role !== 'VIEWER' ? (
            <Button variant="primary" onClick={onCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Přidat plán
            </Button>
          ) : null}
        </div>
      </header>
      <nav
        className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface-raised p-1"
        aria-label="Sekce údržby"
      >
        {(
          [
            ['overview', 'Přehled'],
            ['plans', 'Plány'],
            ['history', 'Historie'],
            ['categories', 'Kategorie'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-current={screen === value ? 'page' : undefined}
            className={`min-h-11 shrink-0 rounded-md px-4 text-body-sm font-medium focus-visible:outline-2 focus-visible:outline-focus ${
              screen === value
                ? 'bg-selected-surface text-primary-emphasis'
                : 'text-text-muted hover:bg-surface-hover'
            }`}
            onClick={() => onScreenChange(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      {screen === 'overview' ? <MaintenanceOverviewPanel /> : null}
      {screen === 'plans' ? (
        <MaintenancePlansPanel
          role={role}
          initialPlanId={initialPlanId}
          onCreate={onCreate}
        />
      ) : null}
      {screen === 'history' ? <MaintenanceHistoryPanel /> : null}
      {screen === 'categories' ? (
        <MaintenanceCategoriesPanel role={role} />
      ) : null}
    </div>
  );
}
