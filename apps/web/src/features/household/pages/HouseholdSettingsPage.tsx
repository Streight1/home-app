import { ThemeSelector } from '../../theme/components/ThemeSelector.js';
import { HouseholdMembersPanel } from '../components/HouseholdMembersPanel.js';
import { CalendarPreferencesPanel } from '../../location/components/CalendarPreferencesPanel.js';

export function HouseholdSettingsPage() {
  return (
    <div className="grid gap-6">
      <header>
        <p className="text-caption font-semibold uppercase tracking-wide text-primary-emphasis">
          Společná domácnost
        </p>
        <h1 className="mt-2 text-page-title font-semibold">Nastavení</h1>
      </header>
      <section
        className="rounded-lg border border-border bg-surface-raised p-5"
        aria-labelledby="appearance-title"
      >
        <h2 id="appearance-title" className="text-section-title font-semibold">
          Vzhled
        </h2>
        <div className="mt-4">
          <ThemeSelector />
        </div>
      </section>
      <HouseholdMembersPanel />
      <CalendarPreferencesPanel />
    </div>
  );
}
