import { Scale } from 'lucide-react';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useTripWeightSummary } from '../../hooks/useExpeditions.js';
import { formatWeight } from '../../lib/expeditionLabels.js';

export function TripWeightSummary({ tripId }: { tripId: string }) {
  const summary = useTripWeightSummary(tripId);
  if (summary.isLoading)
    return <p className="text-body-sm text-text-muted">Počítáme hmotnost…</p>;
  if (summary.isError)
    return (
      <InlineAlert variant="danger">
        Hmotnostní přehled se nepodařilo načíst.
      </InlineAlert>
    );
  if (!summary.data) return null;
  const metrics = [
    ['Základní hmotnost', summary.data.baseWeightGrams],
    ['Spotřební', summary.data.consumableWeightGrams],
    ['Oblečené', summary.data.wornWeightGrams],
    ['Startovní batoh', summary.data.startingPackWeightGrams],
  ] as const;
  return (
    <section className="grid gap-4" aria-labelledby="trip-weight-title">
      <div className="flex items-center gap-2">
        <Scale className="size-5 text-primary-emphasis" aria-hidden="true" />
        <h3 id="trip-weight-title" className="text-section-title font-semibold">
          Hmotnostní přehled
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <article
            key={label}
            className="rounded-lg border border-border bg-surface p-3"
          >
            <p className="text-caption text-text-muted">{label}</p>
            <strong className="mt-1 block text-section-title">
              {formatWeight(value)}
            </strong>
          </article>
        ))}
      </div>
      {summary.data.targetBaseWeightGrams !== null ? (
        <p className="text-body-sm text-text-muted">
          Cíl: {formatWeight(summary.data.targetBaseWeightGrams)} · rozdíl{' '}
          <strong
            className={
              (summary.data.baseWeightDifferenceGrams ?? 0) > 0
                ? 'text-warning'
                : 'text-success'
            }
          >
            {formatWeight(
              Math.abs(summary.data.baseWeightDifferenceGrams ?? 0),
            )}
            {(summary.data.baseWeightDifferenceGrams ?? 0) > 0
              ? ' nad cílem'
              : ' pod cílem'}
          </strong>
        </p>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h4 className="font-semibold">Podle kategorií</h4>
          <ul className="mt-2 grid gap-2">
            {summary.data.categories.map((category) => (
              <li key={category.key} className="flex justify-between gap-3">
                <span>{category.key}</span>
                <strong>{formatWeight(category.systemWeightGrams)}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h4 className="font-semibold">Kontrola připravenosti</h4>
          <p className="mt-2 text-body-sm">
            {summary.data.readiness.packedCount} z{' '}
            {summary.data.readiness.totalCount} položek sbaleno · chybí{' '}
            {summary.data.readiness.missingRequiredCount} povinných ·{' '}
            {summary.data.readiness.unassignedSharedRequiredCount} sdílených bez
            nositele.
          </p>
          <p className="mt-3 text-caption text-text-muted">
            {summary.data.readiness.disclaimer}
          </p>
          {summary.data.readiness.advisoryRules
            .filter(({ acknowledged }) => !acknowledged)
            .map((rule) => (
              <p key={rule.code} className="mt-2 text-caption text-warning">
                {rule.reason}
              </p>
            ))}
        </div>
        <div className="rounded-lg border border-border p-4">
          <h4 className="font-semibold">Podle účastníků</h4>
          <ul className="mt-2 grid gap-2">
            {summary.data.participantWeights.map((participant) => (
              <li key={participant.key} className="flex justify-between gap-3">
                <span>{participant.displayName}</span>
                <strong>{formatWeight(participant.systemWeightGrams)}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h4 className="font-semibold">Nejtěžší položky</h4>
          <ol className="mt-2 grid gap-2">
            {summary.data.heaviest.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>{item.name}</span>
                <strong>{formatWeight(item.weightGrams)}</strong>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
