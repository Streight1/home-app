import type { SchedulingCandidate } from '../types/scheduling.types.js';

export function ParticipantTravelSummary({
  items,
}: {
  items: SchedulingCandidate['participantTravel'];
}) {
  return (
    <div className="grid gap-2 text-caption text-text-muted">
      {items.map((item) => (
        <div key={item.userId}>
          <strong className="text-text">
            {item.displayName ?? 'Člen domácnosti'}
          </strong>
          {item.travelBeforeMinutes !== null ? (
            <span className="ml-2">
              cesta před úkolem přibližně {item.travelBeforeMinutes} min
              {item.departureAt
                ? ` · odjezd ${new Date(item.departureAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </span>
          ) : (
            <span className="ml-2">cesta před úkolem neověřena</span>
          )}
          {item.travelAfterMinutes !== null ? (
            <span> · potom přibližně {item.travelAfterMinutes} min</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
