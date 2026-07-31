import { Backpack, LayoutDashboard, ListChecks, Mountain } from 'lucide-react';
import type { HouseholdRole } from '../../household/household.public.js';
import { GearCatalogPanel } from '../components/gear/GearCatalogPanel.js';
import { ExpeditionsOverviewPanel } from '../components/overview/ExpeditionsOverviewPanel.js';
import { PackTemplatesPanel } from '../components/templates/PackTemplatesPanel.js';
import { TripDetail } from '../components/trips/TripDetail.js';
import { TripsPanel } from '../components/trips/TripsPanel.js';

export type ExpeditionsScreen = 'overview' | 'trips' | 'templates' | 'gear';

const tabs = [
  ['overview', 'Přehled', LayoutDashboard],
  ['trips', 'Výpravy', Mountain],
  ['templates', 'Gearlisty', ListChecks],
  ['gear', 'Výbava', Backpack],
] as const;

export function ExpeditionsPage({
  screen,
  tripId,
  role,
  onScreenChange,
}: {
  screen: ExpeditionsScreen | 'trip';
  tripId?: string;
  role: HouseholdRole;
  onScreenChange: (screen: ExpeditionsScreen) => void;
}) {
  const canWrite = role !== 'VIEWER';
  if (screen === 'trip' && tripId)
    return <TripDetail tripId={tripId} canWrite={canWrite} />;
  return (
    <div className="grid gap-5">
      <header className="aurora-header-surface rounded-lg border border-border p-5 sm:p-6">
        <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
          Trekking, turistika a balení
        </p>
        <h1 className="mt-1 text-page-title font-semibold">Výpravy</h1>
        <p className="mt-2 max-w-2xl text-body-sm text-text-muted">
          Katalog výbavy, snapshotové gearlisty a vysvětlitelná kontrola
          připravenosti bez falešné bezpečnostní garance.
        </p>
      </header>
      <nav
        className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface-raised p-1"
        aria-label="Sekce výprav"
      >
        {tabs.map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-current={screen === value ? 'page' : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-md px-4 text-body-sm font-medium focus-visible:outline-2 focus-visible:outline-focus ${screen === value ? 'bg-selected-surface text-primary-emphasis' : 'text-text-muted hover:bg-surface-hover'}`}
            onClick={() => onScreenChange(value)}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      {screen === 'overview' ? (
        <ExpeditionsOverviewPanel canWrite={canWrite} />
      ) : null}
      {screen === 'trips' ? <TripsPanel canWrite={canWrite} /> : null}
      {screen === 'templates' ? (
        <PackTemplatesPanel canWrite={canWrite} />
      ) : null}
      {screen === 'gear' ? (
        <GearCatalogPanel
          canWrite={canWrite}
          canManageCategories={role === 'OWNER' || role === 'ADMIN'}
        />
      ) : null}
    </div>
  );
}
