import { AlertTriangle, CarFront, Clock3, Route } from 'lucide-react';
import type { TravelPlan } from '../../calendar/types/calendar.types.js';
import { MapyAttribution } from './MapyAttribution.js';

export function RouteEstimateSummary({ plan }: { plan: TravelPlan }) {
  if (plan.status === 'UNAVAILABLE' || plan.status === 'FAILED')
    return (
      <div className="rounded-md border border-warning bg-warning-soft p-3">
        <p className="font-medium">Odhad cesty se nepodařilo vypočítat.</p>
        <p className="text-body-sm text-text-muted">
          Zkontrolujte místo události nebo výpočet zkuste znovu.
        </p>
      </div>
    );
  if (plan.status !== 'READY')
    return (
      <p className="text-body-sm text-text-muted">
        Odhad cesty čeká na přepočítání.
      </p>
    );
  return (
    <div className="grid gap-3 rounded-md border border-border bg-surface-subtle p-4">
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm">
        <span className="flex items-center gap-2">
          <CarFront className="size-4" aria-hidden="true" />
          {plan.routeMode.startsWith('CAR')
            ? 'Autem'
            : plan.routeMode.startsWith('FOOT')
              ? 'Pěšky'
              : 'Na kole'}
        </span>
        <span className="flex items-center gap-2">
          <Clock3 className="size-4" aria-hidden="true" />
          Přibližně {Math.ceil((plan.durationSeconds ?? 0) / 60)} min
        </span>
        <span className="flex items-center gap-2">
          <Route className="size-4" aria-hidden="true" />
          {((plan.distanceMeters ?? 0) / 1000).toLocaleString('cs-CZ', {
            maximumFractionDigits: 1,
          })}{' '}
          km
        </span>
      </div>
      {plan.departureAt ? (
        <p className="font-medium">
          Doporučený odjezd{' '}
          {new Date(plan.departureAt).toLocaleTimeString('cs-CZ', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      ) : null}
      {plan.conflict.hasConflict ? (
        <p
          role="alert"
          className="flex gap-2 rounded-md border border-danger bg-danger-soft p-3 text-body-sm text-danger"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          Na přesun chybí přibližně{' '}
          {Math.ceil(plan.conflict.missingSeconds / 60)} minut.
        </p>
      ) : null}
      <MapyAttribution context="Odhad trasy" />
    </div>
  );
}
