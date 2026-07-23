import { Button } from '../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import type { SchedulingSuggestions } from '../types/scheduling.types.js';

const time = (value: string) =>
  new Date(value).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

export function SchedulingDiagnostics({
  result,
  onWithoutTravel,
  onTomorrow,
  onExpandWindow,
}: {
  result: SchedulingSuggestions;
  onWithoutTravel: () => void;
  onTomorrow: () => void;
  onExpandWindow: () => void;
}) {
  const { diagnostics } = result;
  const codes = new Set(diagnostics.rejections.map(({ code }) => code));
  const tooShort =
    codes.has('INTERVAL_SHORTER_THAN_TASK') &&
    diagnostics.longestFreeIntervalMinutes < result.task.durationMinutes;
  const travelBlocked =
    diagnostics.summary.timeCandidatesGenerated > 0 &&
    diagnostics.summary.feasibleCandidates === 0 &&
    (codes.has('NOT_ENOUGH_TIME_AFTER_PREVIOUS_EVENT') ||
      codes.has('NOT_ENOUGH_TIME_BEFORE_NEXT_EVENT'));
  const entirelyPast =
    codes.has('SEARCH_WINDOW_IN_PAST') &&
    diagnostics.summary.freeIntervalsFound === 0;

  return (
    <div className="grid gap-4">
      {diagnostics.freeIntervals.length ? (
        <div className="rounded-md border border-border bg-surface-subtle p-3">
          <p className="font-medium">Společný volný čas</p>
          <ul className="mt-2 flex flex-wrap gap-2 text-body-sm text-text-muted">
            {diagnostics.freeIntervals.map((interval) => (
              <li
                key={`${interval.startAt}:${interval.endAt}`}
                className="rounded-sm border border-border px-2 py-1 tabular-nums"
              >
                {time(interval.startAt)}–{time(interval.endAt)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {tooShort ? (
        <InlineAlert variant="warning" title="Úkol je příliš dlouhý">
          Nejdelší společný volný interval má{' '}
          {diagnostics.longestFreeIntervalMinutes} minut, ale úkol potřebuje{' '}
          {result.task.durationMinutes} minut.
        </InlineAlert>
      ) : travelBlocked ? (
        <InlineAlert variant="warning" title="Cestu nelze bezpečně vměstnat">
          Časově jsme našli {diagnostics.summary.timeCandidatesGenerated}{' '}
          možností, ale cesta a rezerva kolidují s okolními událostmi.
        </InlineAlert>
      ) : entirelyPast ? (
        <InlineAlert variant="warning" title="Hledané období již uplynulo">
          Zvolená část dne už skončila. Můžete hledat zítra nebo rozšířit časové
          okno.
        </InlineAlert>
      ) : (
        <EmptyState
          title="Není společná dostupnost"
          description="V zadaném období nemají všichni účastníci dostatečně dlouhý společný volný čas."
          compact
        />
      )}
      <div className="flex flex-wrap gap-2">
        {travelBlocked ? (
          <Button onClick={onWithoutTravel}>
            Zobrazit časy bez ověření cesty
          </Button>
        ) : null}
        <Button onClick={onTomorrow}>Hledat zítra</Button>
        <Button onClick={onExpandWindow}>Rozšířit časové okno</Button>
      </div>
    </div>
  );
}
