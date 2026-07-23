import { formatMinorUnits } from '../../../finance/finance.public.js';
import type { SpendingInsight } from '../../types/finance-budget.types.js';

export function InsightComparisonChart({
  insights,
}: {
  insights: SpendingInsight[];
}) {
  const comparable = insights.filter(
    (item) =>
      item.presentation.primaryValueMinor && item.presentation.baselineMinor,
  );
  if (!comparable.length) return null;
  return (
    <section
      aria-labelledby="insight-comparison-title"
      className="rounded-lg border border-border bg-surface p-5"
    >
      <h3
        id="insight-comparison-title"
        className="text-section-title font-semibold"
      >
        Aktuální výdaje proti srovnání
      </h3>
      <div className="mt-4 grid gap-4">
        {comparable.slice(0, 6).map((item) => {
          const currentValue = item.presentation.primaryValueMinor;
          const baselineValue = item.presentation.baselineMinor;
          if (!currentValue || !baselineValue) return null;
          const current = BigInt(currentValue);
          const baseline = BigInt(baselineValue);
          const maximum = current > baseline ? current : baseline;
          const width = (value: bigint) =>
            maximum === 0n ? 0 : Number((value * 100n) / maximum);
          return (
            <div key={item.id} className="grid gap-1.5">
              <p className="text-body-sm font-medium">{item.title}</p>
              <div className="grid gap-1" aria-hidden="true">
                <span
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${String(width(current))}%` }}
                />
                <span
                  className="h-2 rounded-full bg-border-strong"
                  style={{ width: `${String(width(baseline))}%` }}
                />
              </div>
              <p className="text-caption text-text-muted">
                Nyní {formatMinorUnits(current.toString(), item.currencyCode)} ·
                srovnávací medián{' '}
                {formatMinorUnits(baseline.toString(), item.currencyCode)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
