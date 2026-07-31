import { Backpack, ListChecks, Mountain, Plus } from 'lucide-react';
import { useWorkspaceNavigation } from '../../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../../components/ui/Button/Button.js';
import {
  useGear,
  usePackTemplates,
  useTrips,
} from '../../hooks/useExpeditions.js';

export function ExpeditionsOverviewPanel({ canWrite }: { canWrite: boolean }) {
  const workspace = useWorkspaceNavigation();
  const trips = useTrips();
  const templates = usePackTemplates();
  const gear = useGear({ page: 1, pageSize: 10 });
  const nextTrip = trips.data?.find((trip) =>
    ['PLANNING', 'PACKING', 'READY'].includes(trip.status),
  );
  const cards = [
    {
      label: 'Aktivní výpravy',
      value:
        trips.data?.filter((trip) =>
          ['PLANNING', 'PACKING', 'READY'].includes(trip.status),
        ).length ?? 0,
      icon: Mountain,
    },
    {
      label: 'Gearlisty',
      value: templates.data?.length ?? 0,
      icon: ListChecks,
    },
    {
      label: 'Položky výbavy',
      value: gear.data?.pagination.totalItems ?? 0,
      icon: Backpack,
    },
  ];
  return (
    <section
      className="grid gap-5"
      aria-labelledby="expeditions-overview-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="expeditions-overview-title"
            className="text-section-title font-semibold"
          >
            Přehled přípravy
          </h2>
          <p className="text-body-sm text-text-muted">
            Hmotnostní výpočty oddělují nesenou, oblečenou a spotřební zátěž.
          </p>
        </div>
        {canWrite ? (
          <Button
            variant="primary"
            onClick={() => workspace.openOverlay({ kind: 'trip-create' })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nová výprava
          </Button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-lg border border-border bg-surface-raised p-4"
          >
            <Icon className="size-5 text-primary-emphasis" aria-hidden="true" />
            <p className="mt-3 text-page-title font-semibold">{value}</p>
            <p className="text-body-sm text-text-muted">{label}</p>
          </article>
        ))}
      </div>
      <article className="rounded-lg border border-border bg-surface-raised p-5">
        <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
          Nejbližší výprava
        </p>
        {nextTrip ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-section-title font-semibold">
                {nextTrip.title}
              </h3>
              <p className="text-body-sm text-text-muted">
                {nextTrip.startsOn} · {nextTrip.items.length} položek
              </p>
            </div>
            <Button
              onClick={() =>
                workspace.navigate({
                  area: 'expeditions',
                  screen: 'trip',
                  tripId: nextTrip.id,
                })
              }
            >
              Pokračovat v balení
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-body-sm text-text-muted">
            Není naplánovaná žádná budoucí výprava.
          </p>
        )}
      </article>
    </section>
  );
}
