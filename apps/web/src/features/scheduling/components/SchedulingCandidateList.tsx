import type { SchedulingSuggestions } from '../types/scheduling.types.js';
import { SchedulingCandidateCard } from './SchedulingCandidateCard.js';
import { SchedulingDiagnostics } from './SchedulingDiagnostics.js';

const time = (value: string) =>
  new Date(value).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

export function SchedulingCandidateList({
  result,
  selectedToken,
  onSelect,
  onWithoutTravel,
  onTomorrow,
  onExpandWindow,
}: {
  result: SchedulingSuggestions;
  selectedToken: string | null;
  onSelect: (token: string) => void;
  onWithoutTravel: () => void;
  onTomorrow: () => void;
  onExpandWindow: () => void;
}) {
  if (result.candidates.length === 0)
    return (
      <SchedulingDiagnostics
        result={result}
        onWithoutTravel={onWithoutTravel}
        onTomorrow={onTomorrow}
        onExpandWindow={onExpandWindow}
      />
    );
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-section-title font-semibold">Návrhy</legend>
      {result.diagnostics.freeIntervals.length ? (
        <div className="rounded-md border border-border bg-surface-subtle p-3 text-body-sm text-text-muted">
          <p className="font-medium text-text">Společný volný čas</p>
          <p className="mt-1 tabular-nums">
            {result.diagnostics.freeIntervals
              .map(
                (interval) =>
                  `${time(interval.startAt)}–${time(interval.endAt)}`,
              )
              .join(', ')}
          </p>
          <p className="mt-1">
            Ověřeno kandidátů:{' '}
            {result.diagnostics.summary.travelCandidatesEvaluated}.
          </p>
        </div>
      ) : null}
      {result.candidates.map((candidate) => (
        <SchedulingCandidateCard
          key={candidate.candidateToken}
          candidate={candidate}
          selected={selectedToken === candidate.candidateToken}
          onSelect={() => onSelect(candidate.candidateToken)}
        />
      ))}
    </fieldset>
  );
}
