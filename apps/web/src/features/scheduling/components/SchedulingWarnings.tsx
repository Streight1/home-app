import type { SchedulingWarning } from '../types/scheduling.types.js';

const labels: Record<SchedulingWarning, string> = {
  TRAVEL_ORIGIN_UNKNOWN: 'U některého účastníka není známé místo odjezdu.',
  NEXT_EVENT_LOCATION_UNKNOWN: 'Následující událost nemá routovatelné místo.',
  TASK_LOCATION_NOT_ROUTABLE: 'Místo úkolu nelze použít pro výpočet cesty.',
  ROUTING_UNAVAILABLE: 'Cestu se nyní nepodařilo ověřit.',
  TRAVEL_NOT_CONSIDERED: 'Čas byl ověřen bez započtení cesty.',
};

export function SchedulingWarnings({
  warnings,
}: {
  warnings: SchedulingWarning[];
}) {
  if (warnings.length === 0) return null;
  return (
    <ul className="grid gap-1 text-caption text-warning">
      {[...new Set(warnings)].map((warning) => (
        <li key={warning}>• {labels[warning]}</li>
      ))}
    </ul>
  );
}
