import { useState } from 'react';
import type { SchedulingCandidate } from '../types/scheduling.types.js';
import { ParticipantTravelSummary } from './ParticipantTravelSummary.js';
import { SchedulingWarnings } from './SchedulingWarnings.js';

export function SchedulingCandidateCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: SchedulingCandidate;
  selected: boolean;
  onSelect: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const start = new Date(candidate.startAt);
  const end = new Date(candidate.endAt);
  return (
    <div
      className={`grid min-h-11 cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${selected ? 'border-primary bg-selected-surface' : 'border-border hover:bg-surface-hover'}`}
    >
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="radio"
          name="scheduling-candidate"
          checked={selected}
          disabled={candidate.status === 'TRAVEL_NOT_VERIFIED' && !acknowledged}
          onChange={onSelect}
          className="size-5 accent-primary"
        />
        <strong className="text-section-title tabular-nums">
          {start.toLocaleTimeString('cs-CZ', {
            hour: '2-digit',
            minute: '2-digit',
          })}
          –
          {end.toLocaleTimeString('cs-CZ', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </strong>
      </label>
      <ParticipantTravelSummary items={candidate.participantTravel} />
      <SchedulingWarnings warnings={candidate.warnings} />
      {candidate.status === 'TRAVEL_NOT_VERIFIED' ? (
        <label className="flex min-h-11 items-center gap-3 text-body-sm text-text-muted">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="size-5 accent-primary"
          />
          Rozumím, že časově se úkol vejde, ale cesta nebyla ověřena.
        </label>
      ) : null}
    </div>
  );
}
